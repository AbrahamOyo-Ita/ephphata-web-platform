import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { volunteerReviewSchema } from "@/lib/validation";
import { getVolunteer, reviewVolunteer } from "@/lib/data/volunteers";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireApiUser("volunteers.manage");
  if (user instanceof NextResponse) return user;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = volunteerReviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review." },
      { status: 422 }
    );
  }

  const volunteerId = (payload as { volunteerId?: string }).volunteerId;
  if (!volunteerId) {
    return NextResponse.json({ ok: false, error: "Missing application id." }, { status: 400 });
  }

  const existing = getVolunteer(volunteerId);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Application not found." }, { status: 404 });
  }

  const ok = reviewVolunteer(
    volunteerId,
    {
      status: parsed.data.status,
      departmentId: parsed.data.departmentId,
      internalNotes: parsed.data.internalNotes,
    },
    user.id
  );

  if (!ok) {
    return NextResponse.json({ ok: false, error: "Could not update the application." }, { status: 500 });
  }

  await writeAudit({
    actor: user,
    action: "volunteer.review",
    entityType: "volunteer_application",
    entityId: volunteerId,
    detail: {
      from: existing.status,
      to: parsed.data.status,
      departmentChanged:
        parsed.data.departmentId !== undefined && parsed.data.departmentId !== existing.department_id,
    },
  });

  return NextResponse.json({ ok: true });
}
