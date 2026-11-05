import "server-only";
import { db } from "../db";
import { uuid, prayerReference } from "../ids";
import type { PrayerRow, PrayerStatus } from "../types";
import type { PrayerInput } from "../validation";

export function createPrayerRequest(input: PrayerInput, eventId?: string | null) {
  const id = uuid();
  const reference = prayerReference();

  db.prepare(
    `INSERT INTO prayer_requests
      (id, event_id, reference, is_anonymous, display_name, email, phone, request,
       category, allow_follow_up)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    eventId ?? null,
    reference,
    input.isAnonymous ? 1 : 0,
    input.isAnonymous ? "Anonymous" : input.displayName ?? null,
    input.isAnonymous && !input.allowFollowUp ? null : input.email ?? null,
    input.isAnonymous && !input.allowFollowUp ? null : input.phone ?? null,
    input.request.trim(),
    input.category,
    input.allowFollowUp ? 1 : 0
  );

  return { id, reference };
}

export function listPrayerRequests(params: { status?: PrayerStatus | ""; search?: string }): PrayerRow[] {
  const where: string[] = ["1=1"];
  const args: unknown[] = [];
  if (params.status) {
    where.push("status = ?");
    args.push(params.status);
  }
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push("(request LIKE ? OR display_name LIKE ? OR reference LIKE ?)");
    args.push(q, q, q);
  }
  return db
    .prepare(
      `SELECT * FROM prayer_requests WHERE ${where.join(" AND ")}
        ORDER BY
          CASE status WHEN 'follow_up' THEN 0 WHEN 'received' THEN 1
                      WHEN 'in_prayer' THEN 2 WHEN 'answered' THEN 3 ELSE 4 END,
          created_at DESC`
    )
    .all(...args) as PrayerRow[];
}

export function prayerStats() {
  const rows = db
    .prepare("SELECT status, count(*) AS n FROM prayer_requests GROUP BY status")
    .all() as { status: PrayerStatus; n: number }[];
  const map = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>;
  return {
    received: map.received ?? 0,
    in_prayer: map.in_prayer ?? 0,
    follow_up: map.follow_up ?? 0,
    answered: map.answered ?? 0,
    archived: map.archived ?? 0,
    total: rows.reduce((a, r) => a + r.n, 0),
  };
}

export function updatePrayerStatus(id: string, status: PrayerStatus, actorId: string) {
  return (
    db
      .prepare(
        `UPDATE prayer_requests
            SET status = ?, assigned_to = COALESCE(assigned_to, ?), updated_at = datetime('now')
          WHERE id = ?`
      )
      .run(status, actorId, id).changes > 0
  );
}

export function addPrayerNote(id: string, note: string, actorId: string) {
  db.prepare(
    `INSERT INTO prayer_follow_ups (id, prayer_request_id, note, author_id) VALUES (?,?,?,?)`
  ).run(uuid(), id, note.trim(), actorId);
}
