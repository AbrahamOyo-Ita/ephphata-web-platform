import "server-only";
import Database from "better-sqlite3";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

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
