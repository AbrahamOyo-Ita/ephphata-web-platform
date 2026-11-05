import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { updatePrayerStatus, addPrayerNote } from "@/lib/data/prayer";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = ["received", "in_prayer", "follow_up", "answered", "archived"] as const;

/**
 * Prayer status changes.
 * Audit entries record the status transition ONLY - never the content of the
 * request, so the audit log itself cannot become a leak vector.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiUser("prayer.manage");
  if (user instanceof NextResponse) return user;

  let payload: { id?: string; status?: string; internalNotes?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const { id, status, internalNotes } = payload;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  if (!status || !VALID.includes(status as (typeof VALID)[number])) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 422 });
  }

  const ok = updatePrayerStatus(id, status as (typeof VALID)[number], user.id);
  if (!ok) return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });

  if (internalNotes && internalNotes.trim()) {
    addPrayerNote(id, internalNotes, user.id);
  }

  await writeAudit({
    actor: user,
    action: "prayer.update",
    entityType: "prayer_request",
    entityId: id,
    detail: { to: status }, // no content, by design
  });

  return NextResponse.json({ ok: true });
}
