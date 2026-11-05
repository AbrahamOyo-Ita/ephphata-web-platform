import "server-only";
import { db } from "../db";
import { uuid } from "../ids";

export type AudienceRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  source: string;
  subscribed: number;
  first_seen_at: string;
  last_seen_at: string;
  registrations: number;
  events_attended: number;
};

export function listAudience(params: { search?: string; subscribedOnly?: boolean } = {}): AudienceRow[] {
  const where: string[] = ["1=1"];
  const args: unknown[] = [];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push("(a.email LIKE ? OR a.full_name LIKE ? OR a.phone LIKE ?)");
    args.push(q, q, q);
  }
  if (params.subscribedOnly) where.push("a.subscribed = 1");

  return db
    .prepare(
      `SELECT a.*,
              (SELECT count(*) FROM registrations r
                WHERE lower(r.email) = lower(a.email) AND r.deleted_at IS NULL) AS registrations,
              (SELECT count(*) FROM registrations r
                JOIN attendance_records ar ON ar.registration_id = r.id
                WHERE lower(r.email) = lower(a.email)) AS events_attended
         FROM audience_contacts a
        WHERE ${where.join(" AND ")}
        ORDER BY a.last_seen_at DESC`
    )
    .all(...args) as AudienceRow[];
}

export function audienceStats() {
  const total = (db.prepare("SELECT count(*) AS n FROM audience_contacts").get() as { n: number }).n;
  const subscribed = (
    db.prepare("SELECT count(*) AS n FROM audience_contacts WHERE subscribed = 1").get() as { n: number }
  ).n;
  const reachable = (
    db
      .prepare(
        `SELECT count(DISTINCT lower(email)) AS n FROM registrations
          WHERE deleted_at IS NULL AND status = 'confirmed'`
      )
      .get() as { n: number }
  ).n;
  return { total, subscribed, reachable };
}

export function upsertNewsletterSubscriber(email: string, name?: string, phone?: string) {
  const existing = db
    .prepare("SELECT id FROM audience_contacts WHERE email = ?")
    .get(email.toLowerCase()) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE audience_contacts SET subscribed = 1, last_seen_at = datetime('now'),
        full_name = COALESCE(full_name, ?), phone = COALESCE(phone, ?) WHERE id = ?`
    ).run(name ?? null, phone ?? null, existing.id);
    return existing.id;
  }

  const id = uuid();
  db.prepare(
    `INSERT INTO audience_contacts (id, email, full_name, phone, source, subscribed)
     VALUES (?,?,?,?,?,1)`
  ).run(id, email.toLowerCase(), name ?? null, phone ?? null, "newsletter");
  return id;
}

/** Registrants eligible for a campaign, honouring consent opt-outs. */
export function campaignAudience(
  eventId: string,
  descriptor: string
): { email: string; name: string }[] {
  const base = `SELECT r.email, r.first_name || ' ' || r.last_name AS name
                  FROM registrations r
                  LEFT JOIN audience_contacts a ON lower(a.email) = lower(r.email)
                 WHERE r.event_id = ? AND r.deleted_at IS NULL AND r.status = 'confirmed'`;
  const extra =
    descriptor === "newsletter"
      ? " AND a.subscribed = 1"
      : descriptor === "not_checked_in"
        ? " AND NOT EXISTS (SELECT 1 FROM attendance_records ar WHERE ar.registration_id = r.id)"
        : descriptor === "checked_in"
          ? " AND EXISTS (SELECT 1 FROM attendance_records ar WHERE ar.registration_id = r.id)"
          : "";
  return db.prepare(base + extra).all(eventId) as { email: string; name: string }[];
}

export function campaignsList() {
  return db
    .prepare(
      `SELECT c.*, e.title AS event_title
         FROM campaigns c LEFT JOIN events e ON e.id = c.event_id
        ORDER BY c.created_at DESC`
    )
    .all() as {
    id: string;
    name: string;
    channel: string;
    subject: string | null;
    status: string;
    audience: string;
    recipient_count: number;
    delivered_count: number;
    failed_count: number;
    sent_at: string | null;
    created_at: string;
    event_title: string | null;
  }[];
}
