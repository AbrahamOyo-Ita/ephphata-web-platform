import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sha256, uuid, hashIp } from "./ids";
import { can, type Permission, type Role } from "./permissions";
import { writeAudit } from "./audit";

/**
 * Session-based authentication for the operations dashboard.
 * ------------------------------------------------------------------
 * - Passwords: bcrypt (cost 12).
 * - Session tokens: 32 random bytes; only the SHA-256 hash is stored.
 * - Cookies: httpOnly, sameSite=lax, secure in production, 8-hour lifetime.
 * - No public self-registration: accounts are created by invitation.
 */

export const SESSION_COOKIE = "eph_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function sessionTokenHash(raw: string): string {
  const secret = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? null : "ephaphata-dev-session-secret");
  if (!secret) throw new Error("SESSION_SECRET must be configured in production.");
  return sha256(`${secret}:${raw}`);
}

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: "invited" | "active" | "suspended";
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  status: SessionUser["status"];
  password_hash: string | null;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Creates a session row and sets the cookie. */
export async function createSession(profileId: string): Promise<void> {
  const raw = `${uuid()}.${Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64url")}`;
  const expires = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const hdrs = await headers();
  db.prepare(
    `INSERT INTO sessions (id, profile_id, token_hash, user_agent, ip_hash, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    uuid(),
    profileId,
    sessionTokenHash(raw),
    (hdrs.get("user-agent") ?? "").slice(0, 250),
    hashIp(hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null),
    expires
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sessionTokenHash(raw));
  }
  store.delete(SESSION_COOKIE);
}

/** Resolves the current user, or null. Safe to call from any server context. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const row = db
    .prepare(
      `SELECT p.id, p.email, p.full_name, p.role, p.status, s.expires_at
         FROM sessions s
         JOIN profiles p ON p.id = s.profile_id
        WHERE s.token_hash = ?`
    )
    .get(sessionTokenHash(raw)) as (ProfileRow & { expires_at: string }) | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sessionTokenHash(raw));
    return null;
  }
  if (row.status !== "active") return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
  };
}

/** Redirect targets used by the guards below. */
const LOGIN_PATH = "/admin/login";
const FORBIDDEN_PATH = "/admin/forbidden";

/**
 * Guard for admin pages. Redirects instead of throwing so UX stays calm.
 * For route handlers the caller must use `requireApiUser` instead.
 */
export async function requireUser(permission?: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(LOGIN_PATH);
  if (permission && !can(user.role, permission)) redirect(FORBIDDEN_PATH);
  return user;
}

/**
 * Guard for route handlers.
 * ------------------------------------------------------------------
 * Returns the user, or a NextResponse carrying 401 (no session) / 403 (session
 * but wrong role) so the client gets a machine-readable answer instead of a
 * 307 to an HTML login page.
 *
 *   const user = await requireApiUser("team.manage");
 *   if (user instanceof NextResponse) return user;
 */
export async function requireApiUser(permission?: Permission): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthenticated", error: "Please sign in again." },
      { status: 401 }
    );
  }
  if (permission && !can(user.role, permission)) {
    return NextResponse.json(
      { ok: false, code: "forbidden", error: "You do not have permission to do that." },
      { status: 403 }
    );
  }
  return user;
}

export async function attemptLogin(
  email: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const row = db
    .prepare(
      `SELECT id, email, full_name, role, status, password_hash
         FROM profiles WHERE email = ? COLLATE NOCASE`
    )
    .get(email.trim()) as ProfileRow | undefined;

  // Constant-ish response to avoid account enumeration.
  if (!row || !row.password_hash) {
    await bcrypt.compare(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
    return { ok: false, error: "Email or password is incorrect." };
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return { ok: false, error: "Email or password is incorrect." };

  if (row.status === "invited") {
    return { ok: false, error: "This invitation has not been accepted yet." };
  }
  if (row.status === "suspended") {
    return { ok: false, error: "This account is suspended. Contact a super admin." };
  }

  db.prepare("UPDATE profiles SET last_login_at = datetime('now') WHERE id = ?").run(row.id);
  await createSession(row.id);

  const user: SessionUser = {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
  };
  await writeAudit({ actor: user, action: "auth.login", entityType: "profile", entityId: row.id });
  return { ok: true, user };
}
