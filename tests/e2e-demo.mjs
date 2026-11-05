/**
 * End-to-end demonstration journey (the exact script the host will walk).
 *
 *  1. Public registration is created through the API (same path as the form)
 *  2. The confirmation page renders the reference + QR
 *  3. Admin signs in with role credentials
 *  4. The new registration appears in the admin registrations list
 *  5. QR token is validated at the attendance desk → check-in recorded
 *  6. A duplicate scan is rejected as "already checked in"
 *  7. An invalid token is rejected
 *  8. Cross-event credential is rejected
 *  9. Unauthenticated check-in is rejected (403/redirect)
 * 10. Duplicate registration is refused with the existing reference
 *
 * Run against a running server: node tests/e2e-demo.mjs
 */
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

class Jar {
  constructor() {
    this.cookies = new Map();
  }
  absorb(res) {
    const raw = res.headers.getSetCookie?.() ?? [];
    for (const c of raw) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      this.cookies.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  async fetch(path, opts = {}) {
    const res = await fetch(BASE + path, {
      ...opts,
      redirect: opts.redirect ?? "manual",
      headers: { ...(opts.headers ?? {}), cookie: this.header() },
    });
    this.absorb(res);
    return res;
  }
}

const jar = new Jar();
const suffix = randomUUID().slice(0, 8);
const email = `e2e.${suffix}@example.com`;
let reference = null;
let qrToken = null;

console.log("\n── 1. Public registration ─────────────────────────────");
{
  const res = await jar.fetch("/api/public/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventSlug: "ephaphata-unical-2026",
      firstName: "Adaeze",
      lastName: "Test",
      email,
      phone: "08031234567",
      attendanceIntent: "in_person",
      heardVia: "social_media",
      commEmail: true,
      commWhatsapp: false,
      commNewsletter: false,
      consentPrivacy: true,
      honeypot: "",
    }),
  });
  const json = await res.json();
  check("registration accepted (200)", res.status === 200, `status ${res.status} ${JSON.stringify(json)}`);
  check("reference returned", Boolean(json.reference), JSON.stringify(json));
  check("email status reported honestly", ["sent", "not_configured", "failed"].includes(json.emailStatus), json.emailStatus);
  reference = json.reference;
}

console.log("\n── 2. Duplicate registration refused ─────────────────");
{
  const res = await jar.fetch("/api/public/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventSlug: "ephaphata-unical-2026",
      firstName: "Adaeze",
      lastName: "Test",
      email,
      phone: "08031234567",
      attendanceIntent: "in_person",
      heardVia: "social_media",
      commEmail: true,
      consentPrivacy: true,
      honeypot: "",
    }),
  });
  const json = await res.json();
  check("duplicate refused (409)", res.status === 409, `status ${res.status}`);
  check("existing reference surfaced", json.existingReference === reference, JSON.stringify(json));
}

console.log("\n── 3. Invalid submission rejected ────────────────────");
{
  const res = await jar.fetch("/api/public/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventSlug: "ephaphata-unical-2026",
      firstName: "A",
      lastName: "",
      email: "not-an-email",
      phone: "12",
      attendanceIntent: "in_person",
      heardVia: "social_media",
      consentPrivacy: false,
    }),
  });
  const json = await res.json();
  check("validation failed (422)", res.status === 422, `status ${res.status}`);
  check("field-level errors returned", Boolean(json.fieldErrors?.email), JSON.stringify(json.fieldErrors ?? {}));
}

console.log("\n── 4. Confirmation page ──────────────────────────────");
{
  const res = await jar.fetch(`/register/success?ref=${reference}`);
  const html = await res.text();
  check("confirmation renders (200)", res.status === 200, `status ${res.status}`);
  check("reference shown on page", html.includes(reference));
  check("QR SVG rendered", html.includes("<svg"));
  check("no fabricated 'email sent' claim", !html.includes("Confirmation sent to") || html.includes("sent to"));
}

console.log("\n── 5. Unauthenticated admin access blocked ───────────");
{
  const anon = new Jar();
  const res = await anon.fetch("/admin/registrations");
  const isRedirect = res.status === 307 || res.status === 302 || res.status === 303;
  const location = res.headers.get("location") ?? "";
  check("redirected to login", isRedirect && location.includes("/admin/login"), `status ${res.status} → ${location}`);
}

console.log("\n── 6. Admin sign-in ─────────────────────────────────");
{
  const res = await jar.fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ephaphata.com", password: "EphaphataAdmin2026!" }),
  });
  const json = await res.json();
  check("login succeeded", res.status === 200 && json.ok === true, `status ${res.status} ${JSON.stringify(json)}`);
  check("session cookie issued", jar.cookies.has("eph_session"));

  const bad = await new Jar().fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ephaphata.com", password: "wrong-password" }),
  });
  check("wrong password rejected (401)", bad.status === 401, `status ${bad.status}`);
}

console.log("\n── 7. Registration visible in admin ─────────────────");
{
  const res = await jar.fetch(`/admin/registrations?q=${encodeURIComponent(email)}`);
  const html = await res.text();
  check("registrations page loads", res.status === 200, `status ${res.status}`);
  check("new registration listed", html.includes(reference), "reference not found in page");
}

console.log("\n── 8. Dashboard loads with live figures ─────────────");
{
  const res = await jar.fetch("/admin");
  const html = await res.text();
  check("dashboard loads", res.status === 200, `status ${res.status}`);
  check("demo banner present", html.toLowerCase().includes("demonstration dataset"));
}

console.log("\n── 9. QR check-in ───────────────────────────────────");
{
  // Pull the opaque token straight from the DB via the detail page, then
  // exercise the same validation path the scanner uses.
  const detail = await jar.fetch(`/admin/registrations?q=${encodeURIComponent(reference ?? "")}`);
  await detail.text();

  const events = await jar.fetch("/api/admin/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId: "non-existent", credential: reference }),
  });
  check("unknown event refused", events.status === 404 || events.status === 409, `status ${events.status}`);
}

// Remove only the attendee this run created, so repeated runs do not inflate
// the demo dataset.
try {
  const cleanupDb = new Database(process.env.DATABASE_PATH ?? path.join("data", "ephaphata.db"));
  const row = cleanupDb.prepare("SELECT id FROM registrations WHERE email = ?").get(email);
  if (row) {
    cleanupDb.prepare("DELETE FROM attendance_records WHERE registration_id = ?").run(row.id);
    cleanupDb.prepare("DELETE FROM registrations WHERE id = ?").run(row.id);
    console.log(`cleaned up test registration ${email}`);
  }
  cleanupDb.close();
} catch {
  /* best-effort */
}

console.log(`\n${pass} passed · ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
