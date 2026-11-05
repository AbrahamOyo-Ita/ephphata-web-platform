import "server-only";
import { headers } from "next/headers";
import { db, nowIso } from "./db";
import { hashIp } from "./ids";

/**
 * Fixed-window rate limiter for public form endpoints.
 * Backed by SQLite for the demo; swap for Upstash/Redis in production with the
 * same signature.
 */
export type LimitResult = { allowed: boolean; remaining: number; retryAfter: number };

export async function rateLimit(bucket: string, limit: number, windowSec: number): Promise<LimitResult> {
  let identity = "anon";
  try {
    const hdrs = await headers();
    identity = hashIp(hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null) ?? "anon";
  } catch {
    /* no request context */
  }

  const key = `${bucket}:${identity}`;
  const now = Date.now();
  const nowStr = nowIso();

  const row = db
    .prepare("SELECT count, expires_at FROM rate_limits WHERE bucket = ?")
    .get(key) as { count: number; expires_at: string } | undefined;

  if (!row || new Date(row.expires_at).getTime() < now) {
    db.prepare(
      `INSERT INTO rate_limits (bucket, count, expires_at) VALUES (?, 1, ?)
       ON CONFLICT(bucket) DO UPDATE SET count = 1, expires_at = excluded.expires_at`
    ).run(key, new Date(now + windowSec * 1000).toISOString());
    return { allowed: true, remaining: limit - 1, retryAfter: windowSec };
  }

  if (row.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((new Date(row.expires_at).getTime() - now) / 1000)),
    };
  }

  db.prepare("UPDATE rate_limits SET count = count + 1 WHERE bucket = ?").run(key);
  return { allowed: true, remaining: limit - row.count - 1, retryAfter: windowSec };
}

/** Opportunistic cleanup, called from the public form endpoints. */
export function pruneRateLimits(): void {
  db.prepare("DELETE FROM rate_limits WHERE expires_at < ?").run(nowIso());
}
