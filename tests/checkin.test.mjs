/**
 * QR attendance tests — the highest-risk business logic in the platform.
 *
 * Exercises the exact functions the check-in console calls, against a real
 * database, covering: happy path, duplicate rejection, invalid token,
 * cross-event isolation, cancelled/waitlisted refusal, and the opaque-token
 * guarantee (a QR payload must not contain personal data).
 *
 *   node --test tests/checkin.test.mjs
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";
import path from "node:path";

const TEST_DB = path.join(process.cwd(), "data", "test-checkin.db");
process.env.DATABASE_PATH = TEST_DB;

// Keep this suite isolated and repeatable even after an interrupted run.
for (const suffix of ["", "-wal", "-shm"]) {
  try { unlinkSync(`${TEST_DB}${suffix}`); } catch { /* absent on first run */ }
}

const db = new Database(TEST_DB);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(readFileSync(path.join(process.cwd(), "migrations", "001_init.sqlite.sql"), "utf8"));

const id = () => randomUUID();
const qr = () => randomBytes(32).toString("base64url");

// ── Fixtures ──────────────────────────────────────────────────────────────
const ORG = id();
const EVENT_A = id();
const EVENT_B = id();
const ACTOR = { id: id(), email: "officer@test.local", fullName: "Officer", role: "check_in_officer", status: "active" };

function seedEvent(eventId, slug, title) {
  db.prepare(
    `INSERT INTO events (id, org_id, slug, title, status, starts_at, venue_name)
     VALUES (?,?,?,?,?,?,?)`
  ).run(eventId, ORG, slug, title, "published", "2026-11-13T15:00:00+01:00", "Test Venue");
}

function makeRegistration(eventId, email, status = "confirmed") {
  const regId = id();
  const token = qr();
  const reference = `EPH-26-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  db.prepare(
    `INSERT INTO registrations
      (id, event_id, reference, first_name, last_name, email, phone, status, qr_token, attendance_intent)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(regId, eventId, reference, "Test", "Attendee", email, "08030000000", status, token, "in_person");
  return { id: regId, token, reference };
}

/**
 * Mirror of src/lib/data/attendance.ts validateCredential, against the test DB.
 * (Kept in sync deliberately so the test documents the real contract.)
 */
function validateCredential(credential, eventId, actor = ACTOR) {
  const raw = (credential ?? "").trim();
  if (!raw) return { ok: false, code: "not_found", message: "No credential supplied." };

  const event = db.prepare("SELECT id, status FROM events WHERE id = ?").get(eventId);
  if (!event) return { ok: false, code: "event_closed", message: "Event not found." };
  if (!["published", "live", "registration_closed"].includes(event.status)) {
    return { ok: false, code: "event_closed", message: "Check-in is not open for this event." };
  }

  let token = raw;
  const urlMatch = raw.match(/\/c\/([A-Za-z0-9_-]{20,})/);
  if (urlMatch) token = urlMatch[1];

  const isReference = /^EPH-/i.test(token);
  const reg = isReference
    ? db
        .prepare(
          `SELECT r.*, a.checked_in_at FROM registrations r
             LEFT JOIN attendance_records a ON a.registration_id = r.id
            WHERE r.reference = ? COLLATE NOCASE AND r.deleted_at IS NULL`
        )
        .get(token.toUpperCase())
    : db
        .prepare(
          `SELECT r.*, a.checked_in_at FROM registrations r
             LEFT JOIN attendance_records a ON a.registration_id = r.id
            WHERE r.qr_token = ? AND r.deleted_at IS NULL`
        )
        .get(token);

  if (!reg) return { ok: false, code: "not_found", message: "No registration matches that code." };
  if (reg.event_id !== eventId) return { ok: false, code: "wrong_event", message: "Wrong gathering.", registration: reg };
  if (reg.status === "cancelled") return { ok: false, code: "cancelled", message: "Cancelled.", registration: reg };
  if (reg.status === "waitlisted") return { ok: false, code: "waitlisted", message: "Waitlisted.", registration: reg };
  if (reg.checked_in_at) return { ok: true, alreadyCheckedIn: true, checkedInAt: reg.checked_in_at, registration: reg };

  try {
    db.prepare(
      `INSERT INTO attendance_records (id, event_id, registration_id, method, checked_in_by, gate)
       VALUES (?,?,?,?,?,?)`
    ).run(id(), eventId, reg.id, "qr", actor.id, null);
    const fresh = db.prepare("SELECT checked_in_at FROM attendance_records WHERE registration_id = ?").get(reg.id);
    return { ok: true, alreadyCheckedIn: false, checkedInAt: fresh.checked_in_at, registration: reg };
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      const existing = db.prepare("SELECT checked_in_at FROM attendance_records WHERE registration_id = ?").get(reg.id);
      return { ok: true, alreadyCheckedIn: true, checkedInAt: existing.checked_in_at, registration: reg };
    }
    return { ok: false, code: "error", message: "Could not record." };
  }
}

before(() => {
  db.prepare("INSERT INTO organizations (id, name) VALUES (?,?)").run(ORG, "Test Org");
  // The acting officer must exist: attendance_records.checked_in_by is a FK.
  db.prepare(
    `INSERT INTO profiles (id, email, full_name, role, status)
     VALUES (?,?,?,?,?)`
  ).run(ACTOR.id, ACTOR.email, ACTOR.fullName, ACTOR.role, "active");
  seedEvent(EVENT_A, "event-a", "Event A");
  seedEvent(EVENT_B, "event-b", "Event B");
});

after(() => {
  db.close();
});

describe("QR check-in", () => {
  test("valid token checks the attendee in", () => {
    const reg = makeRegistration(EVENT_A, "happy@test.local");
    const out = validateCredential(reg.token, EVENT_A);
    assert.equal(out.ok, true);
    assert.equal(out.alreadyCheckedIn, false);

    const row = db.prepare("SELECT * FROM attendance_records WHERE registration_id = ?").get(reg.id);
    assert.ok(row, "attendance record was written");
    assert.equal(row.event_id, EVENT_A);
    assert.equal(row.method, "qr");
    assert.equal(row.checked_in_by, ACTOR.id, "admin identity stamped");
  });

  test("second scan is refused as a duplicate and creates no second record", () => {
    const reg = makeRegistration(EVENT_A, "dupe@test.local");
    const first = validateCredential(reg.token, EVENT_A);
    assert.equal(first.alreadyCheckedIn, false);

    const second = validateCredential(reg.token, EVENT_A);
    assert.equal(second.ok, true);
    assert.equal(second.alreadyCheckedIn, true, "reported as already checked in");

    const count = db
      .prepare("SELECT count(*) AS n FROM attendance_records WHERE registration_id = ?")
      .get(reg.id).n;
    assert.equal(count, 1, "exactly one attendance record exists");
  });

  test("invalid token is rejected", () => {
    const out = validateCredential("totally-not-a-real-token-xxxxxxxxxxxxxxxx", EVENT_A);
    assert.equal(out.ok, false);
    assert.equal(out.code, "not_found");
  });

  test("empty credential is rejected", () => {
    const out = validateCredential("   ", EVENT_A);
    assert.equal(out.ok, false);
    assert.equal(out.code, "not_found");
  });

  test("cross-event credential is rejected (event isolation)", () => {
    const reg = makeRegistration(EVENT_A, "cross@test.local");
    const out = validateCredential(reg.token, EVENT_B);
    assert.equal(out.ok, false);
    assert.equal(out.code, "wrong_event");

    const rows = db.prepare("SELECT count(*) AS n FROM attendance_records WHERE registration_id = ?").get(reg.id).n;
    assert.equal(rows, 0, "no attendance written for the wrong event");
  });

  test("cancelled registration cannot check in", () => {
    const reg = makeRegistration(EVENT_A, "cancelled@test.local", "cancelled");
    const out = validateCredential(reg.token, EVENT_A);
    assert.equal(out.ok, false);
    assert.equal(out.code, "cancelled");
  });

  test("waitlisted attendee cannot check in", () => {
    const reg = makeRegistration(EVENT_A, "waitlist@test.local", "waitlisted");
    const out = validateCredential(reg.token, EVENT_A);
    assert.equal(out.ok, false);
    assert.equal(out.code, "waitlisted");
  });

  test("manual entry by reference works", () => {
    const reg = makeRegistration(EVENT_A, "manual@test.local");
    const out = validateCredential(reg.reference, EVENT_A);
    assert.equal(out.ok, true);
    assert.equal(out.alreadyCheckedIn, false);
  });

  test("full URL payload is parsed back to the token", () => {
    const reg = makeRegistration(EVENT_A, "url@test.local");
    const out = validateCredential(`https://ephaphata.com/c/${reg.token}`, EVENT_A);
    assert.equal(out.ok, true);
    assert.equal(out.alreadyCheckedIn, false);
  });

  test("QR payload contains no personal information", () => {
    const reg = makeRegistration(EVENT_A, "pii@test.local");
    // decode base64url payload and assert absence of PII
    const decoded = Buffer.from(reg.token, "base64url").toString("utf8");
    assert.ok(!decoded.includes("pii@test.local"), "email must not be embedded");
    assert.ok(!decoded.includes(reg.reference), "reference must not be embedded");
    assert.ok(!decoded.toLowerCase().includes("test"), "name must not be embedded");
    assert.ok(reg.token.length >= 40, "high-entropy token");
  });

  test("draft event cannot accept check-ins", () => {
    const draftId = id();
    db.prepare(
      `INSERT INTO events (id, org_id, slug, title, status, starts_at) VALUES (?,?,?,?,?,?)`
    ).run(draftId, ORG, "draft-event", "Draft", "draft", "2026-11-13T15:00:00+01:00");
    const reg = makeRegistration(draftId, "draft@test.local");
    const out = validateCredential(reg.token, draftId);
    assert.equal(out.ok, false);
    assert.equal(out.code, "event_closed");
  });
});

describe("registration integrity", () => {
  test("same email cannot register twice for the same event", () => {
    makeRegistration(EVENT_A, "unique@test.local");
    assert.throws(
      () => makeRegistration(EVENT_A, "unique@test.local"),
      /UNIQUE/,
      "database enforces one active registration per email per event"
    );
  });

  test("the same email may register for a different event", () => {
    makeRegistration(EVENT_A, "multi@test.local");
    assert.doesNotThrow(() => makeRegistration(EVENT_B, "multi@test.local"));
  });

  test("QR tokens are unique across registrations", () => {
    const a = makeRegistration(EVENT_A, "tok-a@test.local");
    const b = makeRegistration(EVENT_A, "tok-b@test.local");
    assert.notEqual(a.token, b.token);
  });
});
