import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { checkinSchema } from "@/lib/validation";
import { validateCredential } from "@/lib/data/attendance";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Attendance desk endpoint.
 * All credential validation happens server-side: the QR payload is an opaque
 * token, event scoping is enforced here, and a UNIQUE constraint on
 * registration_id makes double check-in impossible even under concurrency.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiUser("checkin.operate");
  if (user instanceof NextResponse) return user;


  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = checkinSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid credential." },
      { status: 422 }
    );
  }

  const { eventId, credential, gate } = parsed.data;

  const outcome = validateCredential(credential, eventId, user, {
    gate,
    method: gate ? "manual" : "qr",
  });

  if (!outcome.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: outcome.code,
        error: outcome.message,
        registration: outcome.registration
          ? {
              name: `${outcome.registration.first_name} ${outcome.registration.last_name}`,
              reference: outcome.registration.reference,
              status: outcome.registration.status,
            }
          : undefined,
      },
      { status: outcome.code === "not_found" ? 404 : 409 }
    );
  }

  if (!outcome.alreadyCheckedIn) {
    await writeAudit({
      actor: user,
      action: "checkin.create",
      entityType: "attendance",
      entityId: outcome.registration.id,
      detail: {
        reference: outcome.registration.reference,
        gate: gate ?? null,
        method: gate ? "manual" : "qr",
        eventId,
      },
    });
  }

  const r = outcome.registration;
  return NextResponse.json({
    ok: true,
    alreadyCheckedIn: outcome.alreadyCheckedIn,
    checkedInAt: outcome.checkedInAt,
    attendee: {
      name: `${r.first_name} ${r.last_name}`,
      reference: r.reference,
      email: r.email,
      phone: r.phone,
      city: r.city,
      intent: r.attendance_intent,
      source: r.source,
    },
  });
}
