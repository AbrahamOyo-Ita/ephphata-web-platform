import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { eventSchema } from "@/lib/validation";
import { createEvent } from "@/lib/data/admin-events";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireApiUser("events.manage");
  if (user instanceof NextResponse) return user;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields.", fieldErrors }, { status: 422 });
  }

  const result = createEvent(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.message, fieldErrors: result.fieldErrors }, { status: 409 });
  }

  await writeAudit({
    actor: user,
    action: "event.create",
    entityType: "event",
    entityId: result.id,
    detail: { slug: parsed.data.slug, status: parsed.data.status },
  });

  return NextResponse.json({ ok: true, id: result.id });
}
