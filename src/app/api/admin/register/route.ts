import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { adminRegistrationSchema, fieldErrors } from "@/lib/validation";
import { getEventById } from "@/lib/data/events";
import { createRegistration } from "@/lib/data/registrations";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manual registration from the operations desk.
 * Reuses the public validation schema and the same duplicate detection, but
 * records `source = 'admin'` and stamps the acting user so the provenance of
 * every record is auditable.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiUser("registrations.manage");
  if (user instanceof NextResponse) return user;


  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = adminRegistrationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error),
      },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const event = getEventById(data.eventId);
  if (!event) {
    return NextResponse.json({ ok: false, error: "Event not found." }, { status: 404 });
  }

  const result = createRegistration(
    {
      ...data,
      eventSlug: event.slug,
      commWhatsapp: data.commWhatsapp ?? false,
      commNewsletter: false,
    },
    event.id,
    { source: "admin", actor: user, status: data.status, notes: data.notes }
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.message,
        code: result.reason,
        existingReference: result.existingReference,
      },
      { status: result.reason === "duplicate" ? 409 : 500 }
    );
  }

  await writeAudit({
    actor: user,
    action: "registration.create",
    entityType: "registration",
    entityId: result.registration.id,
    detail: { source: "admin", reference: result.registration.reference, eventId: event.id },
  });

  return NextResponse.json({
    ok: true,
    id: result.registration.id,
    reference: result.registration.reference,
  });
}
