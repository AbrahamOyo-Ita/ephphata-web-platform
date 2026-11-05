import { NextResponse, type NextRequest } from "next/server";
import { volunteerSchema, fieldErrors } from "@/lib/validation";
import { getEventBySlug } from "@/lib/data/events";
import { createVolunteerApplication } from "@/lib/data/volunteers";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import { sendEmail, emailConfigured, volunteerEmail } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  pruneRateLimits();

  const limit = await rateLimit("volunteer", 4, 900);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${limit.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = volunteerSchema.safeParse(payload);
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
  if (data.honeypot) {
    return NextResponse.json({ ok: false, error: "Submission rejected." }, { status: 400 });
  }

  const event = getEventBySlug(data.eventSlug);
  if (!event) {
    return NextResponse.json({ ok: false, error: "That event could not be found." }, { status: 404 });
  }
  if (!event.volunteer_open || event.status === "completed" || event.status === "archived") {
    return NextResponse.json(
      { ok: false, error: "Volunteer applications for this gathering are closed." },
      { status: 409 }
    );
  }

  const result = createVolunteerApplication(data, event.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.message, code: result.reason },
      { status: result.reason === "duplicate" ? 409 : 500 }
    );
  }

  await writeAudit({
    action: "volunteer.create",
    entityType: "volunteer_application",
    entityId: result.id,
    detail: { eventId: event.id, reference: result.reference, departmentId: data.departmentId },
  });

  let emailStatus: "sent" | "not_configured" | "failed" = "not_configured";
  if (emailConfigured()) {
    const tpl = volunteerEmail({
      fullName: data.fullName,
      reference: result.reference,
      eventTitle: event.title,
    });
    const dispatch = await sendEmail({
      to: data.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "volunteer_application",
      relatedType: "volunteer_application",
      relatedId: result.id,
    });
    emailStatus = dispatch.status;
  }

  return NextResponse.json({ ok: true, reference: result.reference, emailStatus });
}
