import "server-only";
import { db } from "../db";
import { uuid, registrationReference, qrToken } from "../ids";
import type { RegistrationRow, RegistrationWithAttendance } from "../types";
import type { RegistrationInput } from "../validation";
import type { SessionUser } from "../auth";

export type CreateResult =
  | { ok: true; registration: RegistrationRow }
  | { ok: false; reason: "duplicate" | "closed" | "error"; message: string; existingReference?: string };

export type RegistrationListParams = {
  eventId?: string;
  search?: string;
  status?: string;
  source?: string;
  attendance?: "checked_in" | "not_checked_in" | "";
  page?: number;
  pageSize?: number;
  sort?: "newest" | "oldest" | "name";
};

export type RegistrationListResult = {
  rows: RegistrationWithAttendance[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

/** Create a registration with duplicate detection + reference + QR credential. */
export function createRegistration(
  input: RegistrationInput,
  eventId: string,
  opts?: { source?: "public" | "admin"; actor?: SessionUser | null; status?: "confirmed" | "waitlisted"; notes?: string }
): CreateResult {
  const email = input.email.trim().toLowerCase();

  const existing = db
    .prepare(
      `SELECT reference FROM registrations
        WHERE event_id = ? AND lower(email) = ? AND deleted_at IS NULL`
    )
    .get(eventId, email) as { reference: string } | undefined;

  if (existing) {
    return {
      ok: false,
      reason: "duplicate",
      message: "This email is already registered for this gathering.",
      existingReference: existing.reference,
    };
  }

  // Reference collision is astronomically unlikely but must not throw.
  let reference = registrationReference();
  for (let i = 0; i < 5 && db.prepare("SELECT 1 FROM registrations WHERE reference = ?").get(reference); i += 1) {
    reference = registrationReference();
  }

  const id = uuid();
  const prefs = JSON.stringify({
    email: input.commEmail,
    whatsapp: input.commWhatsapp,
    newsletter: input.commNewsletter,
  });

  try {
    db.prepare(
      `INSERT INTO registrations
        (id, event_id, reference, first_name, last_name, email, phone, whatsapp, city,
         attendance_intent, heard_via, communication_prefs, consent_privacy, consent_marketing,
         status, source, qr_token, created_by, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      eventId,
      reference,
      input.firstName.trim(),
      input.lastName.trim(),
      email,
      input.phone.trim(),
      input.whatsapp?.trim() ?? null,
      input.city?.trim() ?? null,
      input.attendanceIntent,
      input.heardVia,
      prefs,
      input.consentPrivacy ? 1 : 0,
      input.commNewsletter ? 1 : 0,
      opts?.status ?? "confirmed",
      opts?.source ?? "public",
      qrToken(),
      opts?.actor?.id ?? null,
      opts?.notes?.trim() ?? null
    );
  } catch (err) {
    const msg = String(err);
    if (msg.includes("UNIQUE")) {
      return { ok: false, reason: "duplicate", message: "This email is already registered." };
    }
    console.error("[registrations.create]", err);
    return { ok: false, reason: "error", message: "We could not save your registration. Please try again." };
  }

  syncAudienceContact(input, eventId);

  const reg = db.prepare("SELECT * FROM registrations WHERE id = ?").get(id) as RegistrationRow;
  return { ok: true, registration: reg };
}

/**
 * Keep the audience directory in step with registrations - but never treat an
 * event registration as marketing consent. `subscribed` only flips when the
 * person explicitly opted into the newsletter.
 */
function syncAudienceContact(input: RegistrationInput, eventId: string): void {
  const email = input.email.trim().toLowerCase();
  const existing = db
    .prepare("SELECT id, subscribed FROM audience_contacts WHERE email = ?")
    .get(email) as { id: string; subscribed: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE audience_contacts
          SET last_seen_at = datetime('now'),
              full_name = COALESCE(full_name, ?),
              phone = COALESCE(phone, ?),
              city = COALESCE(city, ?),
              subscribed = CASE WHEN ? = 1 THEN 1 ELSE subscribed END
        WHERE id = ?`
    ).run(
      `${input.firstName} ${input.lastName}`.trim(),
      input.phone.trim(),
      input.city ?? null,
      input.commNewsletter ? 1 : 0,
      existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO audience_contacts (id, email, full_name, phone, city, source, subscribed)
       VALUES (?,?,?,?,?,?,?)`
    ).run(
      uuid(),
      email,
      `${input.firstName} ${input.lastName}`.trim(),
      input.phone.trim(),
      input.city ?? null,
      "registration",
      input.commNewsletter ? 1 : 0
    );
  }

  db.prepare(
    `INSERT INTO consent_records (id, contact_id, registration_id, purpose, granted, source)
     VALUES (?,?,?,?,?,?)`
  ).run(
    uuid(),
    null,
    null,
    input.commNewsletter ? "newsletter" : "event_updates",
    input.commNewsletter ? 1 : 0,
    `registration:${eventId}`
  );
}

export function findRegistrationByReference(reference: string): RegistrationWithAttendance | null {
  return (
    (db
      .prepare(
        `SELECT r.*, a.checked_in_at, e.title AS event_title, e.slug AS event_slug
           FROM registrations r
           JOIN events e ON e.id = r.event_id
           LEFT JOIN attendance_records a ON a.registration_id = r.id
          WHERE r.reference = ? COLLATE NOCASE AND r.deleted_at IS NULL`
      )
      .get(reference.trim()) as RegistrationWithAttendance) ?? null
  );
}

export function findRegistrationByQrToken(token: string): RegistrationWithAttendance | null {
  return (
    (db
      .prepare(
        `SELECT r.*, a.checked_in_at, e.title AS event_title, e.slug AS event_slug
           FROM registrations r
           JOIN events e ON e.id = r.event_id
           LEFT JOIN attendance_records a ON a.registration_id = r.id
          WHERE r.qr_token = ? AND r.deleted_at IS NULL`
      )
      .get(token) as RegistrationWithAttendance) ?? null
  );
}

export function listRegistrations(params: RegistrationListParams): RegistrationListResult {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const where: string[] = ["r.deleted_at IS NULL"];
  const args: unknown[] = [];

  if (params.eventId) {
    where.push("r.event_id = ?");
    args.push(params.eventId);
  }
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      "(r.first_name LIKE ? OR r.last_name LIKE ? OR r.email LIKE ? OR r.phone LIKE ? OR r.reference LIKE ?)"
    );
    args.push(q, q, q, q, q);
  }
  if (params.status) {
    where.push("r.status = ?");
    args.push(params.status);
  }
  if (params.source) {
    where.push("r.source = ?");
    args.push(params.source);
  }
  if (params.attendance === "checked_in") where.push("a.id IS NOT NULL");
  if (params.attendance === "not_checked_in") where.push("a.id IS NULL");

  const orderBy =
    params.sort === "oldest"
      ? "r.created_at ASC"
      : params.sort === "name"
        ? "r.first_name COLLATE NOCASE ASC, r.last_name COLLATE NOCASE ASC"
        : "r.created_at DESC";

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const from = `FROM registrations r
                LEFT JOIN attendance_records a ON a.registration_id = r.id
                LEFT JOIN events e ON e.id = r.event_id`;

  const total = (
    db.prepare(`SELECT count(*) AS n ${from} ${whereSql}`).get(...args) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT r.*, a.checked_in_at, e.title AS event_title, e.slug AS event_slug
       ${from} ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    )
    .all(...args, pageSize, (page - 1) * pageSize) as RegistrationWithAttendance[];

  return { rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function cancelRegistration(id: string): boolean {
  const res = db
    .prepare("UPDATE registrations SET status='cancelled', updated_at=datetime('now') WHERE id=? AND deleted_at IS NULL")
    .run(id);
  return res.changes > 0;
}

export function updateRegistrationFields(
  id: string,
  fields: { first_name?: string; last_name?: string; phone?: string; whatsapp?: string; city?: string; notes?: string }
): boolean {
  const allowed = ["first_name", "last_name", "phone", "whatsapp", "city", "notes"];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (!keys.length) return false;
  const set = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => (fields as Record<string, unknown>)[k] ?? null);
  const res = db
    .prepare(`UPDATE registrations SET ${set}, updated_at = datetime('now') WHERE id = ?`)
    .run(...values, id);
  return res.changes > 0;
}

export function markConfirmationSent(id: string): void {
  db.prepare("UPDATE registrations SET confirmation_sent_at = datetime('now') WHERE id = ?").run(id);
}

/* ------------------------------------------------------------------ metrics */

export function registrationStats(eventId?: string) {
  const scope = eventId ? "AND r.event_id = ?" : "";
  const args = eventId ? [eventId] : [];

  const total = (
    db
      .prepare(`SELECT count(*) AS n FROM registrations r WHERE r.deleted_at IS NULL AND r.status='confirmed' ${scope}`)
      .get(...args) as { n: number }
  ).n;

  const today = (
    db
      .prepare(
        `SELECT count(*) AS n FROM registrations r
          WHERE r.deleted_at IS NULL ${scope} AND date(r.created_at) = date('now')`
      )
      .get(...args) as { n: number }
  ).n;

  const checkedIn = (
    db
      .prepare(
        `SELECT count(*) AS n FROM attendance_records a
          JOIN registrations r ON r.id = a.registration_id
          WHERE r.deleted_at IS NULL ${scope}`
      )
      .get(...args) as { n: number }
  ).n;

  const waitlisted = (
    db
      .prepare(`SELECT count(*) AS n FROM registrations r WHERE r.status='waitlisted' ${scope}`)
      .get(...args) as { n: number }
  ).n;

  const cancelled = (
    db
      .prepare(`SELECT count(*) AS n FROM registrations r WHERE r.status='cancelled' ${scope}`)
      .get(...args) as { n: number }
  ).n;

  const bySource = db
    .prepare(
      `SELECT r.source, count(*) AS n FROM registrations r
        WHERE r.deleted_at IS NULL ${scope} GROUP BY r.source`
    )
    .all(...args) as { source: string; n: number }[];

  const byIntent = db
    .prepare(
      `SELECT r.attendance_intent AS intent, count(*) AS n FROM registrations r
        WHERE r.deleted_at IS NULL ${scope} GROUP BY r.attendance_intent`
    )
    .all(...args) as { intent: string; n: number }[];

  return { total, today, checkedIn, waitlisted, cancelled, bySource, byIntent };
}

/** Daily registration series for charts (last `days` days, zero-filled). */
export function registrationTrend(eventId: string | undefined, days = 14) {
  const scope = eventId ? "AND event_id = ?" : "";
  const args = eventId ? [eventId] : [];
  const rows = db
    .prepare(
      `SELECT date(created_at) AS d, count(*) AS n
         FROM registrations
        WHERE deleted_at IS NULL ${scope}
          AND date(created_at) >= date('now', ?)
        GROUP BY date(created_at)`
    )
    .all(...args, `-${days - 1} days`) as { d: string; n: number }[];

  const map = new Map(rows.map((r) => [r.d, r.n]));
  const out: { date: string; label: string; registrations: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    out.push({
      date: key,
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      registrations: map.get(key) ?? 0,
    });
  }
  return out;
}

export function recentRegistrations(limit = 6) {
  return db
    .prepare(
      `SELECT r.*, a.checked_in_at, e.title AS event_title
         FROM registrations r
         LEFT JOIN attendance_records a ON a.registration_id = r.id
         LEFT JOIN events e ON e.id = r.event_id
        WHERE r.deleted_at IS NULL
        ORDER BY r.created_at DESC LIMIT ?`
    )
    .all(limit) as RegistrationWithAttendance[];
}
