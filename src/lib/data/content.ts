import "server-only";
import { db } from "../db";

export type ContentPage = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  status: "draft" | "published" | "scheduled" | "archived";
  published_at: string | null;
  updated_at: string;
};

export function getContentPage(slug: string): ContentPage | null {
  return (
    (db.prepare("SELECT * FROM content_pages WHERE slug = ?").get(slug) as ContentPage) ?? null
  );
}

export function listContentPages(): ContentPage[] {
  return db.prepare("SELECT * FROM content_pages ORDER BY slug").all() as ContentPage[];
}

export type Testimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  status: string;
  event_title?: string | null;
  created_at: string;
};

export function listTestimonials(approvedOnly = true): Testimonial[] {
  const where = approvedOnly ? "WHERE t.status = 'approved'" : "";
  return db
    .prepare(
      `SELECT t.*, e.title AS event_title FROM testimonials t
         LEFT JOIN events e ON e.id = t.event_id ${where}
        ORDER BY t.created_at DESC`
    )
    .all() as Testimonial[];
}

export type Gallery = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  category: string | null;
  status: string;
  item_count: number;
  event_title?: string | null;
};

export function listGalleries(publishedOnly = true): Gallery[] {
  const where = publishedOnly ? "WHERE g.status = 'published'" : "";
  return db
    .prepare(
      `SELECT g.*, e.title AS event_title,
              (SELECT count(*) FROM media_assets m WHERE m.gallery_id = g.id) AS item_count
         FROM galleries g LEFT JOIN events e ON e.id = g.event_id
         ${where} ORDER BY g.created_at DESC`
    )
    .all() as Gallery[];
}

export function listMedia(galleryId: string) {
  return db
    .prepare("SELECT * FROM media_assets WHERE gallery_id = ? ORDER BY sort_order")
    .all(galleryId) as { id: string; url: string; alt: string | null; kind: string }[];
}

export function listAnnouncements(publishedOnly = true) {
  const where = publishedOnly ? "WHERE is_published = 1" : "";
  return db
    .prepare(`SELECT * FROM announcements ${where} ORDER BY created_at DESC`)
    .all() as {
    id: string;
    title: string;
    body: string;
    severity: string;
    is_published: number;
    created_at: string;
  }[];
}

/* ------------------------------------------------------------------- timers */

export type TimerSession = {
  id: string;
  event_id: string;
  label: string;
  planned_sec: number;
  elapsed_sec: number;
  state: "idle" | "running" | "paused" | "done";
  started_at: string | null;
  updated_at: string;
};

export function getActiveTimer(eventId: string): TimerSession | null {
  return (
    (db
      .prepare(
        `SELECT * FROM timer_sessions WHERE event_id = ?
          ORDER BY CASE state WHEN 'running' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END, updated_at DESC
          LIMIT 1`
      )
      .get(eventId) as TimerSession) ?? null
  );
}

export function getTimerById(id: string): TimerSession | null {
  return (db.prepare("SELECT * FROM timer_sessions WHERE id = ?").get(id) as TimerSession) ?? null;
}

export function upsertTimer(session: {
  id: string;
  eventId: string;
  segmentId?: string | null;
  label: string;
  plannedSec: number;
  elapsedSec: number;
  state: TimerSession["state"];
}): void {
  const exists = db.prepare("SELECT id FROM timer_sessions WHERE id = ?").get(session.id);
  if (exists) {
    db.prepare(
      `UPDATE timer_sessions
          SET label=?, planned_sec=?, elapsed_sec=?, state=?, started_at=?, updated_at=datetime('now')
        WHERE id=?`
    ).run(
      session.label,
      session.plannedSec,
      session.elapsedSec,
      session.state,
      session.state === "running" ? new Date().toISOString() : null,
      session.id
    );
  } else {
    db.prepare(
      `INSERT INTO timer_sessions (id, event_id, segment_id, label, planned_sec, elapsed_sec, state, started_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).run(
      session.id,
      session.eventId,
      session.segmentId ?? null,
      session.label,
      session.plannedSec,
      session.elapsedSec,
      session.state,
      session.state === "running" ? new Date().toISOString() : null
    );
  }
}

/* ------------------------------------------------------------ announcements */

export function createAnnouncement(input: {
  eventId?: string | null;
  title: string;
  body: string;
  severity: string;
  publish: boolean;
}) {
  const { uuid } = require("../ids") as typeof import("../ids");
  const id = uuid();
  db.prepare(
    `INSERT INTO announcements (id, event_id, title, body, severity, is_published)
     VALUES (?,?,?,?,?,?)`
  ).run(
    id,
    input.eventId ?? null,
    input.title,
    input.body,
    input.severity,
    input.publish ? 1 : 0
  );
  return id;
}
