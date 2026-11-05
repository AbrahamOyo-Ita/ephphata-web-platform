/**
 * EPHAPHATA - production bootstrap
 * ------------------------------------------------------------------
 * For a FRESH deployment. Creates the database from the shipped schema and one
 * real super-admin account. No demonstration data of any kind.
 *
 *   node scripts/bootstrap-admin.mjs
 *
 * Required environment:
 *   ADMIN_EMAIL          - the real operator's email
 *   ADMIN_PASSWORD       - at least 12 characters
 *   ADMIN_NAME           - display name (optional, defaults to "Administrator")
 *
 * Safe to re-run: if the email already exists it is promoted to super_admin and
 * given the new password, and nothing else in the database is touched.
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "ephaphata.db");
const dir = path.dirname(DB_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = (process.env.ADMIN_NAME ?? "Administrator").trim();

function fail(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

if (!email) fail("ADMIN_EMAIL is required.");
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail("ADMIN_EMAIL is not a valid email address.");
if (password.length < 12) fail("ADMIN_PASSWORD must be at least 12 characters.");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create the schema if this is a fresh database. The schema file is idempotent
// for table creation only, so we guard on the profiles table ourselves.
const existing = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='profiles'")
  .get();

if (!existing) {
  console.log("→ applying schema from migrations/001_init.sqlite.sql");
  db.exec(readFileSync(path.join(process.cwd(), "migrations", "001_init.sqlite.sql"), "utf8"));
} else {
  console.log("→ schema already present");
}

const hash = bcrypt.hashSync(password, 12);
const found = db.prepare("SELECT id FROM profiles WHERE lower(email) = ?").get(email);

if (found) {
  db.prepare(
    "UPDATE profiles SET password_hash = ?, role = 'super_admin', status = 'active', full_name = ? WHERE id = ?"
  ).run(hash, name, found.id);
  console.log(`✓ existing account promoted and password reset: ${email}`);
} else {
  db.prepare(
    `INSERT INTO profiles (id, email, full_name, phone, role, status, password_hash)
     VALUES (?,?,?,?,?,?,?)`
  ).run(randomUUID(), email, name, null, "super_admin", "active", hash);
  console.log(`✓ super admin created: ${email}`);
}

// An organisation row is required by several admin screens.
const org = db.prepare("SELECT id FROM organizations LIMIT 1").get();
if (!org) {
  db.prepare(
    `INSERT INTO organizations (id, name, short_name, tagline, email, phone, address, social)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    randomUUID(),
    "EphaPhata with OT Power & The Attackers",
    "EphaPhata",
    "One gathering. One purpose.",
    "hello@ephaphata.com",
    null,
    null,
    null
  );
  console.log("✓ organisation record created");
}

db.close();
console.log("\nDone. Sign in at /admin/login with the credentials you supplied.\n");
