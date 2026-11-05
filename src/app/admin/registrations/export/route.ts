import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listRegistrations } from "@/lib/data/registrations";
import { getFeaturedEvent } from "@/lib/data/events";
import { writeAudit } from "@/lib/audit";
import { ATTENDANCE_LABELS, HEARD_VIA_LABELS } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Escapes a value for CSV, neutralising formula injection (=, +, -, @). */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * CSV export of the current filtered view.
 * Exports are audited - this is personal data leaving the system.
 */
export async function GET(req: NextRequest) {
  const user = await requireUser("registrations.view");
  const params = req.nextUrl.searchParams;

  const featured = getFeaturedEvent();
  const eventId = params.get("event") ?? featured?.id ?? undefined;

  const { rows } = listRegistrations({
    eventId,
    search: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    source: params.get("source") ?? undefined,
    attendance: (params.get("attendance") as "checked_in" | "not_checked_in" | undefined) ?? undefined,
    page: 1,
    pageSize: 100,
    sort: "newest",
  });

  const header = [
    "Reference",
    "First name",
    "Last name",
    "Email",
    "Phone",
    "WhatsApp",
    "City",
    "Attendance",
    "Heard via",
    "Status",
    "Source",
    "Checked in at",
    "Registered at",
    "Event",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.reference,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.whatsapp ?? "",
        r.city ?? "",
        ATTENDANCE_LABELS[r.attendance_intent] ?? r.attendance_intent,
        HEARD_VIA_LABELS[r.heard_via ?? ""] ?? r.heard_via ?? "",
        r.status,
        r.source,
        r.checked_in_at ?? "",
        r.created_at,
        r.event_title ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  await writeAudit({
    actor: user,
    action: "registration.export",
    entityType: "registration",
    detail: { count: rows.length, eventId, filters: Object.fromEntries(params.entries()) },
  });

  const filename = `ephaphata-registrations-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
