import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getFeaturedEvent } from "@/lib/data/events";
import { listVolunteers } from "@/lib/data/volunteers";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Export of accepted volunteers only - the list coordinators work from on the day. */
export async function GET() {
  const user = await requireUser("volunteers.view");
  const event = getFeaturedEvent();
  if (!event) return NextResponse.json({ ok: false, error: "No active event." }, { status: 404 });

  const rows = listVolunteers({ eventId: event.id, status: "accepted" });

  const header = ["Reference", "Name", "Email", "Phone", "WhatsApp", "Department", "Availability", "Accepted at"];
  const lines = [header.join(",")];
  for (const r of rows) {
    let availability = "";
    try {
      availability = (JSON.parse(r.availability ?? "[]") as string[]).join(" | ");
    } catch {
      availability = r.availability ?? "";
    }
    lines.push(
      [r.reference, r.full_name, r.email, r.phone, r.whatsapp ?? "", r.department_name ?? "", availability, r.reviewed_at ?? ""]
        .map(csvCell)
        .join(",")
    );
  }

  await writeAudit({
    actor: user,
    action: "volunteer.export",
    entityType: "volunteer_application",
    detail: { count: rows.length, eventId: event.id },
  });

  return new NextResponse("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ephaphata-volunteers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
