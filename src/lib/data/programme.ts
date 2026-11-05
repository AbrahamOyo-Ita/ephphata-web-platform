import { db } from "@/lib/db";
import { uuid } from "@/lib/ids";

export type ScheduleItem = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  starts_at: string | null;
  duration_min: number;
  sort_order: number;
};

export type ProgrammeSegment = {
  id: string;
  title: string;
  kind: string;
  startsAt: string | null;
  durationMinutes: number;
  owner: string | null;
  notes: string | null;
};

/**
 * The run of show. `event_schedule` stores a speaker and description; the
 * controller presents them as owner + notes.
 */
export function getSchedule(eventId: string): ProgrammeSegment[] {
  const rows = db
    .prepare(
      `SELECT id, title, description, speaker, starts_at, duration_min
         FROM event_schedule
        WHERE event_id = ?
        ORDER BY sort_order, starts_at`
    )
    .all(eventId) as ScheduleItem[];

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: "segment",
    startsAt: r.starts_at,
    durationMinutes: r.duration_min,
    owner: r.speaker,
    notes: r.description,
  }));
}

export function addSegment(
  eventId: string,
  input: { title: string; description?: string; speaker?: string; startsAt?: string; durationMin?: number }
) {
  const nextOrder =
    (db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM event_schedule WHERE event_id = ?").get(eventId) as {
      n: number;
    }).n;

  const id = uuid();
  db.prepare(
    `INSERT INTO event_schedule (id, event_id, title, description, speaker, starts_at, duration_min, sort_order)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    id,
    eventId,
    input.title.trim(),
    input.description?.trim() || null,
    input.speaker?.trim() || null,
    input.startsAt || null,
    input.durationMin ?? 20,
    nextOrder
  );
  return id;
}

export function updateSegment(
  id: string,
  input: { title?: string; description?: string; speaker?: string; startsAt?: string; durationMin?: number }
) {
  return (
    db
      .prepare(
        `UPDATE event_schedule
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                speaker = COALESCE(?, speaker),
                starts_at = COALESCE(?, starts_at),
                duration_min = COALESCE(?, duration_min)
          WHERE id = ?`
      )
      .run(
        input.title?.trim() || null,
        input.description ?? null,
        input.speaker ?? null,
        input.startsAt ?? null,
        input.durationMin ?? null,
        id
      ).changes > 0
  );
}

export function deleteSegment(id: string) {
  return db.prepare("DELETE FROM event_schedule WHERE id = ?").run(id).changes > 0;
}

/* ── Timer persistence (mirrors the client state for reporting) ─────────── */

export function startTimerSession(eventId: string, segmentId: string, label: string, plannedSec: number) {
  const id = uuid();
  db.prepare(
    `INSERT INTO timer_sessions (id, event_id, segment_id, label, planned_sec, state, started_at)
     VALUES (?,?,?,?,?, 'running', datetime('now'))`
  ).run(id, eventId, segmentId, label, plannedSec);
  return id;
}

export function updateTimerSession(id: string, elapsedSec: number, state: "running" | "paused" | "done") {
  return (
    db
      .prepare(
        `UPDATE timer_sessions SET elapsed_sec = ?, state = ?, updated_at = datetime('now') WHERE id = ?`
      )
      .run(elapsedSec, state, id).changes > 0
  );
}
