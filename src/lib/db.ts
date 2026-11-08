import "server-only";
import Database from "better-sqlite3";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * EPHAPHATA data access
 * ------------------------------------------------------------------
 * Runtime adapter for the demonstration environment (SQLite via better-sqlite3).
 * The schema is the runnable mirror of migrations/postgres/001_init.sql.
 *
 * To move to Supabase/Postgres, only this module and the query helpers
 * beneath src/lib/data/* change: they are the single boundary between
 * application code and the database.
 */

// Vercel's deployment filesystem is read-only. `/tmp` is writable there, but
// ephemeral; a durable host should always provide DATABASE_PATH on persistent
// storage before enabling registrations or admin operations.
const DEFAULT_DB_PATH = process.env.VERCEL
  ? "/tmp/ephaphata.db"
  : path.join(process.cwd(), "data", "ephaphata.db");
const DB_PATH = process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;
const DB_DIR = path.dirname(DB_PATH);

declare global {
  // eslint-disable-next-line no-var
  var __ephaphata_db: Database.Database | undefined;
}

function create(): Database.Database {
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  // Idempotent bootstrap so a fresh clone runs without a manual migrate step.
  const schema = readFileSync(
    path.join(process.cwd(), "migrations", "001_init.sqlite.sql"),
    "utf8"
  );
  db.exec(schema);
  // Keep existing local/demo databases compatible with the current form.
  const registrationColumns = db.prepare("PRAGMA table_info(registrations)").all() as Array<{ name: string }>;
  if (!registrationColumns.some((column) => column.name === "occupation")) {
    try {
      db.exec("ALTER TABLE registrations ADD COLUMN occupation TEXT NOT NULL DEFAULT ''");
    } catch (error) {
      // Next may initialise several workers in parallel during a build.
      // Another worker winning this idempotent upgrade is safe.
      if (!String(error).includes("duplicate column name: occupation")) throw error;
    }
  }

  // A fresh Vercel runtime starts with an empty SQLite file. Keep the public
  // registration journey usable until the organiser creates/edits the live
  // event in Admin by bootstrapping the verified UNICAL gathering.
  if (!(db.prepare("SELECT 1 FROM events LIMIT 1").get())) {
    const orgId = randomUUID();
    const eventId = randomUUID();
    db.prepare(
      `INSERT INTO organizations (id, name, short_name, tagline, email, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      orgId,
      "Ephphata with OT Power & The Attackers",
      "Ephphata",
      "One gathering. One purpose.",
      "hello@ephaphata.com",
      "+234 800 000 0000",
      "Calabar, Cross River State, Nigeria"
    );
    db.prepare(
      `INSERT INTO events
       (id, org_id, slug, title, edition_label, theme, scripture, summary, description,
        status, is_featured, starts_at, ends_at, timezone, venue_name, venue_address,
        maps_url, poster_url, hero_bg, capacity, registration_open, volunteer_open, contact_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`
    ).run(
      eventId,
      orgId,
      "ephaphata-unical-2026",
      "Ephphata UNICAL 2026",
      "UNICAL",
      "THE NEW",
      "Isaiah 43:19",
      "One gathering. One purpose. A live worship experience with OT Power & The Attackers at the University of Calabar.",
      "Ephphata UNICAL is the Calabar edition of the gathering - a live night of worship, the word and prayer with OT Power & The Attackers.",
      "2026-11-13T15:00:00+01:00",
      "2026-11-13T21:00:00+01:00",
      "Africa/Lagos",
      "UNICAL International Conference Centre",
      "University of Calabar, Calabar, Cross River State, Nigeria",
      "https://www.google.com/maps/search/?api=1&query=UNICAL+International+Conference+Centre+Calabar",
      "/brand/flyers/unical-lineup.webp",
      "green",
      5000,
      "events@ephaphata.com"
    );
  }

  // Vercel/ephemeral hosts cannot run the one-time CLI bootstrap against the
  // same filesystem as each server function. When production credentials are
  // configured, provision that account on the first database open instead.
  // Existing accounts and all other data remain untouched.
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (email && password.length >= 12 && !db.prepare("SELECT 1 FROM profiles WHERE lower(email) = ?").get(email)) {
    db.prepare(
      `INSERT INTO profiles (id, email, full_name, phone, role, status, password_hash)
       VALUES (?, ?, ?, ?, 'super_admin', 'active', ?)`
    ).run(
      randomUUID(),
      email,
      (process.env.ADMIN_NAME ?? "Administrator").trim() || "Administrator",
      null,
      bcrypt.hashSync(password, 12)
    );
  }

  return db;
}

export const db: Database.Database = global.__ephaphata_db ?? create();
if (process.env.NODE_ENV !== "production") global.__ephaphata_db = db;

/** Is the demonstration dataset present? */
export function isSeeded(): boolean {
  const row = db.prepare("SELECT count(*) AS n FROM events").get() as { n: number };
  return row.n > 0;
}

export function nowIso(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export type Tx = Database.Transaction<(...args: never[]) => unknown>;
