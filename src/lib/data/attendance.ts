import "server-only";
import { db } from "../db";
import { uuid } from "../ids";
import type { RegistrationWithAttendance } from "../types";
import type { SessionUser } from "../auth";

export type CheckinOutcome =
  | {
      ok: true;
      registration: RegistrationWithAttendance;
      alreadyCheckedIn: boolean;
      checkedInAt: string;
    }
  | {
      ok: false;
      code:
        | "not_found"
        | "cancelled"
        | "waitlisted"
        | "wrong_event"
        | "event_closed"
        | "error";
      message: string;
      registration?: RegistrationWithAttendance;
    };

/**
 * Server-side credential validation.
 * The QR payload contains only an opaque 43-char token - never a name, email
 * or registration reference - so a photographed badge leaks nothing personal.
 * Validation, event scoping and duplicate detection all happen here.
 */
export function validateCredential(
  credential: string,
  eventId: string,
  actor: SessionUser,
  opts?: { gate?: string; method?: "qr" | "manual" | "lookup" }
): CheckinOutcome {
  const raw = credential.trim();
  if (!raw) return { ok: false, code: "not_found", message: "No credential supplied." };

  const event = db
    .prepare("SELECT id, status, title FROM events WHERE id = ?")
    .get(eventId) as { id: string; status: string; title: string } | undefined;

  if (!event) return { ok: false, code: "event_closed", message: "Event not found." };
  if (!["published", "live", "registration_closed"].includes(event.status)) {
    return { ok: false, code: "event_closed", message: "Check-in is not open for this event." };
  }

  // Accept a full URL payload (qr encoded as /c/<token>), a bare token, or a reference.
  let token = raw;
  const urlMatch = raw.match(/\/c\/([A-Za-z0-9_-]{20,})/);
  if (urlMatch) token = urlMatch[1]!;

  const isReference = /^EPH-/i.test(token);

  const reg = (
    isReference
      ? db
          .prepare(
            `SELECT r.*, a.checked_in_at, e.title AS event_title
               FROM registrations r
               JOIN events e ON e.id = r.event_id
               LEFT JOIN attendance_records a ON a.registration_id = r.id
              WHERE r.reference = ? COLLATE NOCASE AND r.deleted_at IS NULL`
          )
          .get(token.toUpperCase())
      : db
          .prepare(
            `SELECT r.*, a.checked_in_at, e.title AS event_title
               FROM registrations r
               JOIN events e ON e.id = r.event_id
               LEFT JOIN attendance_records a ON a.registration_id = r.id
              WHERE r.qr_token = ? AND r.deleted_at IS NULL`
          )
          .get(token)
  ) as RegistrationWithAttendance | undefined;

  if (!reg) {
    return { ok: false, code: "not_found", message: "No registration matches that code." };
  }
  if (reg.event_id !== eventId) {
    return {
      ok: false,
      code: "wrong_event",
      message: "This credential belongs to a different gathering.",
      registration: reg,
    };
  }
  if (reg.status === "cancelled") {
    return { ok: false, code: "cancelled", message: "This registration was cancelled.", registration: reg };
  }
  if (reg.status === "waitlisted") {
    return { ok: false, code: "waitlisted", message: "This attendee is on the waitlist.", registration: reg };
  }

  if (reg.checked_in_at) {
    return {
      ok: true,
      registration: reg,
      alreadyCheckedIn: true,
      checkedInAt: reg.checked_in_at,
    };
  }

  try {
    const recordId = uuid();
    db.prepare(
      `INSERT INTO attendance_records (id, event_id, registration_id, method, checked_in_by, gate)
       VALUES (?,?,?,?,?,?)`
    ).run(
      recordId,
      eventId,
      reg.id,
      opts?.method ?? "qr",
      actor.id,
      opts?.gate ?? null
    );

    const updated = {
      ...reg,
      checked_in_at: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    return { ok: true, registration: updated, alreadyCheckedIn: false, checkedInAt: updated.checked_in_at };
  } catch (err) {
    console.error("[attendance.validate]", err);
    // The UNIQUE constraint on registration_id is the final guard against
    // double check-ins under concurrent scans.
    if (String(err).includes("UNIQUE")) {
      const existing = db
        .prepare("SELECT checked_in_at FROM attendance_records WHERE registration_id = ?")
        .get(reg.id) as { checked_in_at: string } | undefined;
      return {
        ok: true,
        registration: reg,
        alreadyCheckedIn: true,
        checkedInAt: existing?.checked_in_at ?? "",
      };
    }
    return { ok: false, code: "error", message: "Check-in could not be recorded. Try again." };
  }
}

export function attendanceStats(eventId: string) {
  const total = (
    db
      .prepare(
        "SELECT count(*) AS n FROM registrations WHERE event_id = ? AND status='confirmed' AND deleted_at IS NULL"
      )
      .get(eventId) as { n: number }
  ).n;
  const checkedIn = (
    db.prepare("SELECT count(*) AS n FROM attendance_records WHERE event_id = ?").get(eventId) as {
      n: number;
    }
  ).n;
  return { total, checkedIn, rate: total ? Math.round((checkedIn / total) * 100) : 0 };
}

/** Hourly arrival curve for the live attendance panel. */
export function arrivalCurve(eventId: string) {
  return db
    .prepare(
      `SELECT strftime('%H', checked_in_at) AS hour, count(*) AS n
         FROM attendance_records WHERE event_id = ?
        GROUP BY hour ORDER BY hour`
    )
    .all(eventId) as { hour: string; n: number }[];
}

export function recentCheckins(eventId: string, limit = 8) {
  return db
    .prepare(
      `SELECT a.checked_in_at, a.method, r.first_name, r.last_name, r.reference
         FROM attendance_records a
         JOIN registrations r ON r.id = a.registration_id
        WHERE a.event_id = ?
        ORDER BY a.checked_in_at DESC LIMIT ?`
    )
    .all(eventId, limit) as {
    checked_in_at: string;
    method: string;
    first_name: string;
    last_name: string;
    reference: string;
  }[];
}
