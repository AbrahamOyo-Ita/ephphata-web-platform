import { NextResponse, type NextRequest } from "next/server";
import { prayerSchema, fieldErrors } from "@/lib/validation";
import { getEventBySlug } from "@/lib/data/events";
import { createPrayerRequest } from "@/lib/data/prayer";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Prayer submissions.
 * Audit logs record that a request arrived - never its content, which stays
 * confined to the prayer_requests table and the prayer team.
 */
export async function POST(req: NextRequest) {
  pruneRateLimits();

  const limit = await rateLimit("prayer", 5, 900);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many submissions. Try again in ${limit.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = prayerSchema.safeParse(payload);
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
  const event = data.eventSlug ? getEventBySlug(data.eventSlug) : null;
  const result = createPrayerRequest(data, event?.id ?? null);

  await writeAudit({
    action: "prayer.create",
    entityType: "prayer_request",
    entityId: result.id,
    detail: { reference: result.reference, anonymous: data.isAnonymous, eventId: event?.id ?? null },
  });

  return NextResponse.json({ ok: true, reference: result.reference });
}
