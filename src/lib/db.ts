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
