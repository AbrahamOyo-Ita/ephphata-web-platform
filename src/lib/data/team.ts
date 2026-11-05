import "server-only";
import { db } from "../db";
import { uuid } from "../ids";
import type { Role } from "../permissions";

export type TeamMember = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  status: "invited" | "active" | "suspended";
  last_login_at: string | null;
  created_at: string;
  has_password: number;
  active_sessions: number;
};

export function listTeam(): TeamMember[] {
  return db
    .prepare(
      `SELECT p.id, p.email, p.full_name, p.phone, p.role, p.status,
              p.last_login_at, p.created_at,
              (p.password_hash IS NOT NULL) AS has_password,
              (SELECT count(*) FROM sessions s
                WHERE s.profile_id = p.id AND s.expires_at > datetime('now')) AS active_sessions
         FROM profiles p
        ORDER BY
          CASE p.status WHEN 'active' THEN 0 WHEN 'invited' THEN 1 ELSE 2 END,
          p.full_name`
    )
    .all() as TeamMember[];
}

export function getTeamMember(id: string): TeamMember | null {
  return (
    (db
      .prepare(
        `SELECT p.id, p.email, p.full_name, p.phone, p.role, p.status,
                p.last_login_at, p.created_at,
                (p.password_hash IS NOT NULL) AS has_password,
                (SELECT count(*) FROM sessions s
                  WHERE s.profile_id = p.id AND s.expires_at > datetime('now')) AS active_sessions
           FROM profiles p WHERE p.id = ?`
      )
      .get(id) as TeamMember | undefined) ?? null
  );
}

/**
 * Invite a staff member. There is deliberately no public sign-up: an account
 * exists only because a super admin created it here.
 */
export function inviteMember(
  input: { email: string; fullName: string; phone?: string; role: Role },
  invitedBy: string
): { ok: true; id: string; inviteToken: string } | { ok: false; message: string } {
  const existing = db
    .prepare("SELECT id FROM profiles WHERE email = ? COLLATE NOCASE")
    .get(input.email) as { id: string } | undefined;

  if (existing) {
    return { ok: false, message: "Someone with that email already has an account." };
  }

  const id = uuid();
  const inviteToken = uuid() + uuid().replace(/-/g, "");
  db.prepare(
    `INSERT INTO profiles (id, email, full_name, phone, role, status, invite_token, invited_by)
     VALUES (?,?,?,?,?, 'invited', ?, ?)`
  ).run(id, input.email, input.fullName, input.phone ?? null, input.role, inviteToken, invitedBy);

  // The raw token is returned only here - it is never read back again.
  return { ok: true, id, inviteToken };
}

export function setMemberRole(id: string, role: Role) {
  return (
    db
      .prepare("UPDATE profiles SET role = ?, updated_at = datetime('now') WHERE id = ?")
      .run(role, id).changes > 0
  );
}

export function setMemberStatus(id: string, status: "active" | "suspended") {
  const changed =
    db
      .prepare("UPDATE profiles SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, id).changes > 0;

  // Suspending an account must also kill its sessions, immediately.
  if (changed && status === "suspended") {
    db.prepare("DELETE FROM sessions WHERE profile_id = ?").run(id);
  }
  return changed;
}

export function removeMember(id: string) {
  db.prepare("DELETE FROM sessions WHERE profile_id = ?").run(id);
  return db.prepare("DELETE FROM profiles WHERE id = ?").run(id).changes > 0;
}

/** Guard: never allow the last active super admin to be demoted or removed. */
export function activeSuperAdmins(exceptId?: string): number {
  const row = db
    .prepare(
      `SELECT count(*) AS n FROM profiles
        WHERE role = 'super_admin' AND status = 'active' ${exceptId ? "AND id <> ?" : ""}`
    )
    .get(...(exceptId ? [exceptId] : [])) as { n: number };
  return row.n;
}
