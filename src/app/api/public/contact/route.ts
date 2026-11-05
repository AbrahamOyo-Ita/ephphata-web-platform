import { NextResponse, type NextRequest } from "next/server";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { uuid } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contact form.
 * Messages are persisted as an archived announcement-like record so no enquiry
 * is silently dropped when email delivery is not configured.
 */
export async function POST(req: NextRequest) {
  pruneRateLimits();

  const limit = await rateLimit("contact", 4, 900);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many messages. Try again in ${limit.retryAfter} seconds.` },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
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

  const d = parsed.data;
  if (d.honeypot) {
    return NextResponse.json({ ok: false, error: "Submission rejected." }, { status: 400 });
  }

  const id = uuid();
  db.prepare(
    `INSERT INTO announcements (id, title, body, severity, is_published)
     VALUES (?,?,?,?,0)`
  ).run(
    id,
    `Contact enquiry from ${d.name} (${d.subject})`,
    `From: ${d.name} <${d.email}>\nSubject: ${d.subject}\n\n${d.message}`,
    "info"
  );

  await writeAudit({
    action: "contact.create",
    entityType: "announcement",
    entityId: id,
    detail: { subject: d.subject },
  });

  return NextResponse.json({ ok: true });
}
