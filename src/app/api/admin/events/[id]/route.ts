import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { eventSchema } from "@/lib/validation";
import { getEventById } from "@/lib/data/events";
import { updateEvent } from "@/lib/data/admin-events";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser("events.manage");
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const existing = getEventById(id);
  if (!existing) return NextResponse.json({ ok: false, error: "Event not found." }, { status: 404 });

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

  const result = updateEvent(id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.message, fieldErrors: result.fieldErrors }, { status: 409 });
  }

  // Record exactly which fields changed - not the values, which may be long.
  const changed = Object.keys(parsed.data).filter(
    (k) => JSON.stringify((parsed.data as Record<string, unknown>)[k]) !== JSON.stringify((existing as unknown as Record<string, unknown>)[k])
  );

  await writeAudit({
    actor: user,
    action: "event.update",
    entityType: "event",
    entityId: id,
    detail: { changed },
  });

  return NextResponse.json({ ok: true, id });
}
