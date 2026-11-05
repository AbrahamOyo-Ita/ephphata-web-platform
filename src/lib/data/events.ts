import "server-only";
import { db } from "../db";
import type { EventRow, FaqRow, ScheduleRow, SpeakerRow } from "../types";

const PUBLIC_STATUSES = `('published','registration_closed','live','completed')`;

export function listEvents(opts?: { includeAll?: boolean }): EventRow[] {
  const where = opts?.includeAll ? "" : `WHERE status IN ${PUBLIC_STATUSES}`;
  return db
    .prepare(`SELECT * FROM events ${where} ORDER BY starts_at DESC`)
    .all() as EventRow[];
}

export function getEventBySlug(slug: string): EventRow | null {
  return (db.prepare("SELECT * FROM events WHERE slug = ?").get(slug) as EventRow) ?? null;
}

export function getEventById(id: string): EventRow | null {
  return (db.prepare("SELECT * FROM events WHERE id = ?").get(id) as EventRow) ?? null;
}

/** The single event the public site promotes front-and-centre. */
export function getFeaturedEvent(): EventRow | null {
  return (
    (db
      .prepare(
        `SELECT * FROM events
          WHERE status IN ('published','registration_closed','live')
          ORDER BY is_featured DESC, starts_at ASC LIMIT 1`
      )
      .get() as EventRow) ?? null
  );
}

export function getUpcomingEvents(limit = 3): EventRow[] {
  return db
    .prepare(
      `SELECT * FROM events WHERE status IN ('published','registration_closed','live')
        AND starts_at >= datetime('now') ORDER BY starts_at ASC LIMIT ?`
    )
    .all(limit) as EventRow[];
}

export function getPastEvents(limit = 12): EventRow[] {
  return db
    .prepare(
      `SELECT * FROM events WHERE status IN ('completed','archived')
        ORDER BY starts_at DESC LIMIT ?`
    )
    .all(limit) as EventRow[];
}

/** States in which an event is shown on the public site at all. */
export const PUBLIC_EVENT_STATUSES = ["published", "registration_closed", "live", "completed"] as const;

export function isPublicEvent(event: EventRow): boolean {
  return (PUBLIC_EVENT_STATUSES as readonly string[]).includes(event.status);
}

/**
 * Loads an event and its related content.
 * `publicOnly` is used by the public routes: drafts and archived events must
 * never be reachable on a guessable URL, even though the admin preview needs
 * to read them.
 */
export function getEventBundle(slug: string, opts: { publicOnly?: boolean } = {}) {
  const event = getEventBySlug(slug);
  if (!event) return null;
  if (opts.publicOnly && !isPublicEvent(event)) return null;
  return {
    event,
    speakers: db
      .prepare("SELECT * FROM event_speakers WHERE event_id = ? ORDER BY sort_order")
      .all(event.id) as SpeakerRow[],
    schedule: db
      .prepare("SELECT * FROM event_schedule WHERE event_id = ? ORDER BY sort_order")
      .all(event.id) as ScheduleRow[],
    faqs: db
      .prepare("SELECT * FROM event_faqs WHERE event_id = ? ORDER BY sort_order")
      .all(event.id) as FaqRow[],
    departments: db
      .prepare(
        "SELECT * FROM volunteer_departments WHERE event_id = ? ORDER BY sort_order"
      )
      .all(event.id) as import("../types").DepartmentRow[],
  };
}

export function getDepartments(eventId: string) {
  return db
    .prepare("SELECT * FROM volunteer_departments WHERE event_id = ? ORDER BY sort_order")
    .all(eventId) as import("../types").DepartmentRow[];
}

export function isRegistrationOpen(event: EventRow): boolean {
  if (!event.registration_open) return false;
  if (!["published", "registration_closed", "live"].includes(event.status)) return false;
  if (event.status === "registration_closed") return false;
  return new Date(event.starts_at).getTime() > Date.now();
}

export function canRegisterErrorMessage(event: EventRow): string | null {
  if (event.status === "draft") return "Registration for this gathering has not opened yet.";
  if (event.status === "completed" || event.status === "archived")
    return "This gathering has already taken place. Follow us for the next edition.";
  if (event.status === "registration_closed" || !event.registration_open)
    return "Registration for this gathering is now closed.";
  if (new Date(event.starts_at).getTime() <= Date.now())
    return "This gathering has already started. Please speak to a steward at the venue.";
  return null;
}
