import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/permissions";
import { inviteMemberSchema, teamUpdateSchema } from "@/lib/validation";
import { activeSuperAdmins, inviteMember, setMemberRole, setMemberStatus, getTeamMember } from "@/lib/data/team";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireApiUser("team.manage");
  if (user instanceof NextResponse) return user;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = inviteMemberSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid invitation." },
      { status: 422 }
    );
  }

  const result = inviteMember(
    { ...parsed.data, role: parsed.data.role as Role },
    user.id
  );
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.message }, { status: 409 });
  }

  await writeAudit({
    actor: user,
    action: "team.invite",
    entityType: "profile",
    entityId: result.id,
    detail: { role: parsed.data.role },
  });

  // The token is returned exactly once, to the inviting admin, and never
  // stored in plaintext anywhere the browser can read it later.
  return NextResponse.json({
    ok: true,
    id: result.id,
    invitePath: `/admin/accept-invite?token=${result.inviteToken}`,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await requireApiUser("team.manage");
  if (user instanceof NextResponse) return user;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = teamUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update." },
      { status: 422 }
    );
  }

  const { id, role, status } = parsed.data;
  const target = getTeamMember(id);
  if (!target) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

  if (id === user.id) {
    return NextResponse.json({ ok: false, error: "You cannot change your own account." }, { status: 403 });
  }

  if (role && !ROLES.includes(role as Role)) {
    return NextResponse.json({ ok: false, error: "Unknown role." }, { status: 422 });
  }

  // Never remove the last route into the platform.
  const demotingSuperAdmin = target.role === "super_admin" && role && role !== "super_admin";
  const suspendingSuperAdmin = target.role === "super_admin" && status === "suspended";
  if ((demotingSuperAdmin || suspendingSuperAdmin) && activeSuperAdmins(id) === 0) {
    return NextResponse.json(
      { ok: false, error: "This is the last active super admin - promote someone else first." },
      { status: 409 }
    );
  }

  if (role) setMemberRole(id, role as Role);
  if (status) setMemberStatus(id, status);

  await writeAudit({
    actor: user,
    action: role ? "team.role_change" : "team.status_change",
    entityType: "profile",
    entityId: id,
    detail: { from: { role: target.role, status: target.status }, to: { role: role ?? target.role, status: status ?? target.status } },
  });

  return NextResponse.json({ ok: true });
}
