import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { cancelRegistration } from "@/lib/data/registrations";
import { getRegistrationForAdmin } from "@/lib/data/admin-registrations";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireApiUser("registrations.manage");
  if (user instanceof NextResponse) return user;

  let payload: { id?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!payload.id) return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });

  const reg = getRegistrationForAdmin(payload.id);
  if (!reg) return NextResponse.json({ ok: false, error: "Registration not found." }, { status: 404 });

  // Attendance already recorded → cancelling would falsify the record.
  if (reg.checked_in_at) {
    return NextResponse.json(
      { ok: false, error: "This attendee has already checked in - the record cannot be cancelled." },
      { status: 409 }
    );
  }

  if (reg.status === "cancelled") {
    return NextResponse.json({ ok: false, error: "This registration is already cancelled." }, { status: 409 });
  }

  const ok = cancelRegistration(reg.id);
  if (!ok) return NextResponse.json({ ok: false, error: "Could not cancel." }, { status: 500 });

  await writeAudit({
    actor: user,
    action: "registration.cancel",
    entityType: "registration",
    entityId: reg.id,
    detail: { reference: reg.reference, previousStatus: reg.status },
  });

  return NextResponse.json({ ok: true });
}
