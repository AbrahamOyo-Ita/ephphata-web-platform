import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { createAnnouncement } from "@/lib/data/content";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEVERITIES = ["info", "important", "urgent"] as const;

/**
 * Publishes a site announcement.
 * Announcements are the one piece of website copy an operator can change
 * without a deploy, so this is the write path behind the Content page.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiUser("content.manage");
  if (user instanceof NextResponse) return user;

  let payload: { title?: string; body?: string; severity?: string; publish?: boolean; eventId?: string | null };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const title = (payload.title ?? "").trim();
  const body = (payload.body ?? "").trim();
  const severity = payload.severity ?? "info";

  if (title.length < 3) {
    return NextResponse.json({ ok: false, error: "Give the announcement a title.", fieldErrors: { title: "Too short." } }, { status: 422 });
  }
  if (body.length < 3) {
    return NextResponse.json({ ok: false, error: "Write a short message.", fieldErrors: { body: "Too short." } }, { status: 422 });
  }
  if (!SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) {
    return NextResponse.json({ ok: false, error: "Unknown severity." }, { status: 422 });
  }

  const id = createAnnouncement({
    eventId: payload.eventId ?? null,
    title,
    body,
    severity,
    publish: payload.publish !== false,
  });

  await writeAudit({
    actor: user,
    action: "content.announcement",
    entityType: "announcement",
    entityId: id,
    detail: { severity, published: payload.publish !== false }, // never the copy itself
  });

  return NextResponse.json({ ok: true, id });
}
