import { NextResponse, type NextRequest } from "next/server";
import { registrationSchema, fieldErrors } from "@/lib/validation";
import { canRegisterErrorMessage, getEventBySlug, isRegistrationOpen } from "@/lib/data/events";
import { createRegistration, markConfirmationSent } from "@/lib/data/registrations";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import { registrationEmail, sendEmail, emailConfigured } from "@/lib/notifications";
import { formatEventDate } from "@/lib/format";
import { headers } from "next/headers";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/public/register
 * ------------------------------------------------------------------
 * The only public write path for registrations. Every rule lives here:
 * rate limiting → event window → schema validation → duplicate check →
 * persistence → best-effort notification. The response tells the truth about
 * whether the confirmation email actually left the building.
 */
export async function POST(req: NextRequest) {
  pruneRateLimits();

  // 6 registrations per 10 minutes per pseudonymised IP
  const limit = await rateLimit("register", 6, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many attempts. Please try again in ${limit.retryAfter} seconds.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please check the highlighted fields and try again.",
        fieldErrors: fieldErrors(parsed.error),
      },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Honeypot: a filled field means a bot. Respond 200-shaped failure without
  // creating a record, so scrapers do not learn the rule.
  if (data.honeypot) {
    return NextResponse.json({ ok: false, error: "Submission rejected." }, { status: 400 });
  }

  const event = getEventBySlug(data.eventSlug);
  if (!event) {
    return NextResponse.json({ ok: false, error: "That event could not be found." }, { status: 404 });
  }
  if (!isRegistrationOpen(event)) {
    return NextResponse.json(
      { ok: false, error: canRegisterErrorMessage(event) ?? "Registration is closed." },
      { status: 409 }
    );
  }

  const result = createRegistration(data, event.id, { source: "public" });

  if (!result.ok) {
    if (result.reason === "duplicate") {
      return NextResponse.json(
        {
          ok: false,
          code: "duplicate",
          error: "This email is already registered for this gathering.",
          existingReference: result.existingReference,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: result.message }, { status: 500 });
  }

  const reg = result.registration;

  await writeAudit({
    action: "registration.create",
    entityType: "registration",
    entityId: reg.id,
    detail: { source: "public", eventId: event.id, reference: reg.reference },
  });

  // Confirmation email - best effort, honestly reported.
  let emailStatus: "sent" | "not_configured" | "failed" = "not_configured";
  if (emailConfigured()) {
    let origin = site.url;
    if (!origin) {
      const hdrs = await headers();
      const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
      const proto = hdrs.get("x-forwarded-proto") ?? "http";
      origin = `${proto}://${host}`;
    }
    const tpl = registrationEmail({
      firstName: reg.first_name,
      eventTitle: event.title,
      eventDate: formatEventDate(event.starts_at),
      venue: [event.venue_name, event.venue_address].filter(Boolean).join(", "),
      reference: reg.reference,
      checkinUrl: `${origin}/register/success?ref=${reg.reference}`,
    });
    const dispatch = await sendEmail({
      to: reg.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "registration_confirmation",
      relatedType: "registration",
      relatedId: reg.id,
    });
    emailStatus = dispatch.status;
    if (dispatch.status === "sent") markConfirmationSent(reg.id);
  }

  return NextResponse.json({
    ok: true,
    reference: reg.reference,
    emailStatus,
  });
}
