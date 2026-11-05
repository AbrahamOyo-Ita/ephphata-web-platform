import "server-only";
import { db } from "../db";
import { uuid } from "../ids";

export type EventInputData = {
  title: string;
  slug: string;
  theme?: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  venueName: string;
  venueAddress?: string;
  capacity: number;
  status: string;
  registrationOpen?: boolean;
};

type Result =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/** The demo org is the single tenant for this deployment. */
function orgId(): string {
  const row = db.prepare("SELECT id FROM organizations ORDER BY created_at LIMIT 1").get() as
    | { id: string }
    | undefined;
  if (row) return row.id;
  const id = uuid();
  db.prepare("INSERT INTO organizations (id, name) VALUES (?,?)").run(id, "EPHAPHATA");
  return id;
}

function slugTaken(slug: string, exceptId?: string): boolean {
  const row = db
    .prepare(`SELECT id FROM events WHERE slug = ? ${exceptId ? "AND id <> ?" : ""}`)
    .get(...(exceptId ? [slug, exceptId] : [slug])) as { id: string } | undefined;
  return Boolean(row);
}

export function createEvent(input: EventInputData): Result {
  if (slugTaken(input.slug)) {
    return {
      ok: false,
      message: "That URL slug is already used by another event.",
      fieldErrors: { slug: "Already in use - choose a different slug." },
    };
  }

  const id = uuid();
  db.prepare(
    `INSERT INTO events
      (id, org_id, slug, title, theme, description, starts_at, ends_at,
       venue_name, venue_address, capacity, status, registration_open, hero_bg)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    orgId(),
    input.slug,
    input.title,
    input.theme || null,
    input.description || null,
    input.startsAt,
    input.endsAt || null,
    input.venueName,
    input.venueAddress || null,
    input.capacity || null,
    input.status,
    input.registrationOpen === false ? 0 : 1,
    "multicolor"
  );

  return { ok: true, id };
}

export function updateEvent(id: string, input: EventInputData): Result {
  if (slugTaken(input.slug, id)) {
    return {
      ok: false,
      message: "That URL slug is already used by another event.",
      fieldErrors: { slug: "Already in use - choose a different slug." },
    };
  }

  const changes = db
    .prepare(
      `UPDATE events SET
         slug = ?, title = ?, theme = ?, description = ?,
         starts_at = ?, ends_at = ?,
         venue_name = ?, venue_address = ?,
         capacity = ?, status = ?, registration_open = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(
      input.slug,
      input.title,
      input.theme || null,
      input.description || null,
      input.startsAt,
      input.endsAt || null,
      input.venueName,
      input.venueAddress || null,
      input.capacity || null,
      input.status,
      input.registrationOpen === false ? 0 : 1,
      id
    ).changes;

  return changes > 0 ? { ok: true, id } : { ok: false, message: "Event not found." };
}

export function updateVolunteerOpen(id: string, open: boolean) {
  return db.prepare("UPDATE events SET volunteer_open = ?, updated_at = datetime('now') WHERE id = ?").run(open ? 1 : 0, id)
    .changes > 0;
}
