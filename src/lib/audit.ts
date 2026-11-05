import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import { uuid, hashIp } from "./ids";
import type { SessionUser } from "./auth";

export type AuditInput = {
  actor?: SessionUser | null;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
};

/**
 * Append-only audit trail. Never throws into the caller: a logging failure
 * must not break an operation the user already completed.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    let ipHash: string | null = null;
    try {
      const hdrs = await headers();
      ipHash = hashIp(hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null);
    } catch {
      /* headers unavailable (e.g. background job) */
    }

    db.prepare(
      `INSERT INTO audit_logs (id, actor_id, actor_email, action, entity_type, entity_id, detail, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuid(),
      input.actor?.id ?? null,
      input.actor?.email ?? null,
      input.action,
      input.entityType ?? null,
      input.entityId ?? null,
      input.detail ? JSON.stringify(input.detail) : null,
      ipHash
    );
  } catch (err) {
    console.error("[audit] failed to record", input.action, err);
  }
}

export type AuditRow = {
  id: string;
  action: string;
  actor_email: string | null;
  entity_type: string | null;
  entity_id: string | null;
  detail: string | null;
  created_at: string;
};

export function recentAudit(limit = 12): AuditRow[] {
  return db
    .prepare(
      `SELECT id, action, actor_email, entity_type, entity_id, detail, created_at
         FROM audit_logs ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as AuditRow[];
}

export type AuditListParams = { search?: string; action?: string; limit?: number };

/** Filterable audit trail for the /admin/audit screen. */
export function listAudit(params: AuditListParams = {}): AuditRow[] {
  const where: string[] = ["1=1"];
  const args: unknown[] = [];

  if (params.action) {
    where.push("action = ?");
    args.push(params.action);
  }
  if (params.search) {
    where.push("(actor_email LIKE ? OR action LIKE ? OR entity_type LIKE ? OR entity_id LIKE ?)");
    const like = `%${params.search}%`;
    args.push(like, like, like, like);
  }

  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  return db
    .prepare(
      `SELECT id, action, actor_email, entity_type, entity_id, detail, created_at
         FROM audit_logs
        WHERE ${where.join(" AND ")}
        ORDER BY created_at DESC, rowid DESC
        LIMIT ?`
    )
    .all(...args, limit) as AuditRow[];
}
