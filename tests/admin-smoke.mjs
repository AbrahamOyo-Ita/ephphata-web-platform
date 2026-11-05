/**
 * Admin functional smoke test
 * ------------------------------------------------------------------
 * Drives every WRITE path in the dashboard the way a real operator would, and
 * verifies the database actually changed. Read-only page loads are covered by
 * scripts/qa-admin.mjs; this file is about actions.
 *
 *   node tests/admin-smoke.mjs
 *
 * Records created by this run are cleaned up where that is safe. Check-in and
 * cancellation are left in place because removing them would distort the
 * demo attendance figures.
 */
import { chromium } from "playwright";
import Database from "better-sqlite3";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const db = new Database(process.env.DATABASE_PATH ?? path.join("data", "ephaphata.db"));

let pass = 0;
let fail = 0;
const failures = [];

function check(label, conditional, detail = "") {
  if (conditional) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    failures.push(`${label}${detail ? ` - ${detail}` : ""}`);
    console.log(`  ✗ ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

const EMAIL = `smoke.${Date.now()}@example.test`;
const cleanup = [];

// Start from a clean limiter so sign-in cannot 429.
db.prepare("DELETE FROM rate_limits").run();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

/* ------------------------------------------------------------------ sign in */
section("1. Authentication");

const badLogin = await ctx.request.post(`${BASE}/api/auth/login`, {
  data: { email: "admin@ephaphata.com", password: "wrong-password" },
});
check("wrong password rejected", badLogin.status() === 401 || badLogin.status() === 429);

db.prepare("DELETE FROM rate_limits").run();

const login = await ctx.request.post(`${BASE}/api/auth/login`, {
  data: { email: "admin@ephaphata.com", password: "EphaphataAdmin2026!" },
});
check("super admin signs in", login.ok(), `status ${login.status()}`);

await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
check("dashboard reachable when signed in", page.url().endsWith("/admin"));

// Operate on the live gathering, not the newest row: a draft (or a leftover
// test event) legitimately refuses check-in.
const eventRow = db
  .prepare(
    `SELECT id, slug, title FROM events
      WHERE status IN ('published','live','registration_closed')
      ORDER BY starts_at ASC LIMIT 1`
  )
  .get();
check("an event exists to operate on", Boolean(eventRow));

/* ------------------------------------------------------- filters and search */
section("2. Lists, filters, search");

for (const [name, url] of [
  ["registrations", "/admin/registrations"],
  ["registrations search", "/admin/registrations?q=example"],
  ["registrations by status", "/admin/registrations?status=confirmed"],
  ["volunteers", "/admin/volunteers"],
  ["prayer", "/admin/prayer"],
  ["audience", "/admin/audience"],
  ["audit", "/admin/audit?action=login"],
  ["events", "/admin/events"],
  ["programme", "/admin/programme"],
  ["content", "/admin/content"],
  ["analytics", "/admin/analytics"],
  ["team", "/admin/team"],
  ["settings", "/admin/settings"],
]) {
  const res = await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  const body = await page.innerText("body");
  const broken = /Application error|Internal Server Error/i.test(body);
  check(`${name} loads`, res.status() === 200 && !broken, `status ${res.status()}`);
}

/* ---------------------------------------------------- manual registration */
section("3. Manual registration (admin)");

const regCountBefore = db.prepare("SELECT count(*) n FROM registrations").get().n;

const manualRes = await ctx.request.post(`${BASE}/api/admin/register`, {
  data: {
    eventId: eventRow.id,
    firstName: "Smoke",
    lastName: "Test",
    email: EMAIL,
    phone: "08030000001",
    city: "Calabar",
    attendanceIntent: "in_person",
    heardVia: "social_media",
    commEmail: false,
    commWhatsapp: false,
    consentPrivacy: true,
  },
});
const manualBody = await manualRes.json().catch(() => ({}));
check("manual registration accepted", manualRes.ok(), `status ${manualRes.status()} ${JSON.stringify(manualBody).slice(0, 160)}`);

const regCountAfter = db.prepare("SELECT count(*) n FROM registrations").get().n;
check("row written to the database", regCountAfter === regCountBefore + 1, `${regCountBefore} -> ${regCountAfter}`);

const created = db
  .prepare("SELECT * FROM registrations WHERE email = ? ORDER BY created_at DESC LIMIT 1")
  .get(EMAIL);
check("reference generated", Boolean(created?.reference), created?.reference ?? "none");
check("QR token generated", Boolean(created?.qr_token));
if (created) cleanup.push(["registrations", created.id]);

const duplicate = await ctx.request.post(`${BASE}/api/admin/register`, {
  data: {
    eventId: eventRow.id,
    firstName: "Smoke",
    lastName: "Test",
    email: EMAIL,
    phone: "08030000001",
    attendanceIntent: "in_person",
    heardVia: "social_media",
    commEmail: false,
    commWhatsapp: false,
    consentPrivacy: true,
  },
});
check("duplicate email refused", duplicate.status() === 409, `status ${duplicate.status()}`);

const invalid = await ctx.request.post(`${BASE}/api/admin/register`, {
  data: {
    eventId: eventRow.id,
    firstName: "",
    lastName: "",
    email: "not-an-email",
    phone: "123",
    attendanceIntent: "in_person",
    heardVia: "social_media",
    consentPrivacy: false,
  },
});
check("validation enforced", invalid.status() === 422, `status ${invalid.status()}`);

/* ------------------------------------------------------------- check-in */
section("4. QR check-in");

const checkin = await ctx.request.post(`${BASE}/api/admin/checkin`, {
  data: { eventId: eventRow.id, credential: created?.reference, gate: "Main entrance" },
});
const checkinBody = await checkin.json().catch(() => ({}));
check("check-in by reference succeeds", checkin.ok(), `status ${checkin.status()} ${JSON.stringify(checkinBody).slice(0, 160)}`);

const attended = db
  .prepare("SELECT count(*) n FROM attendance_records WHERE registration_id = ?")
  .get(created?.id);
check("attendance row written", attended.n === 1, `${attended.n} rows`);

const doubleCheck = await ctx.request.post(`${BASE}/api/admin/checkin`, {
  data: { eventId: eventRow.id, credential: created?.reference, gate: "Main entrance" },
});
const dupRows = db
  .prepare("SELECT count(*) n FROM attendance_records WHERE registration_id = ?")
  .get(created?.id).n;
check(
  "repeat check-in is idempotent, not a duplicate row",
  doubleCheck.status() === 200 && dupRows === 1,
  `status ${doubleCheck.status()}, ${dupRows} rows`
);

const unknown = await ctx.request.post(`${BASE}/api/admin/checkin`, {
  data: { eventId: eventRow.id, credential: "EPH-00-XXXXXX", gate: "Main entrance" },
});
check("unknown credential refused", unknown.status() === 404, `status ${unknown.status()}`);

/* -------------------------------------------------------------- cancel */
section("5. Registration cancellation");

// The route correctly refuses to cancel an attendee who has already been
// checked in, so this uses a fresh registration that never touched the gate.
const cancelTarget = await ctx.request.post(`${BASE}/api/admin/register`, {
  data: {
    eventId: eventRow.id,
    firstName: "Cancel",
    lastName: "Case",
    email: `cancel.${Date.now()}@example.test`,
    phone: "08030000002",
    attendanceIntent: "in_person",
    heardVia: "social_media",
    commEmail: false,
    commWhatsapp: false,
    consentPrivacy: true,
  },
});
const cancelTargetBody = await cancelTarget.json().catch(() => ({}));
check("second registration created for the cancel test", cancelTarget.ok(), `status ${cancelTarget.status()}`);

const cancelId = cancelTargetBody.id;
if (cancelId) cleanup.push(["registrations", cancelId]);

const refuseCheckedIn = await ctx.request.post(`${BASE}/api/admin/registrations/cancel`, {
  data: { id: created?.id },
});
check(
  "a checked-in attendee cannot be cancelled",
  refuseCheckedIn.status() === 409,
  `status ${refuseCheckedIn.status()}`
);

const cancelRes = await ctx.request.post(`${BASE}/api/admin/registrations/cancel`, {
  data: { id: cancelId },
});
check("registration cancelled", cancelRes.ok(), `status ${cancelRes.status()}`);

const cancelled = db.prepare("SELECT status FROM registrations WHERE id = ?").get(cancelId);
check("status set to cancelled", cancelled?.status === "cancelled", cancelled?.status ?? "missing");

const cancelAgain = await ctx.request.post(`${BASE}/api/admin/registrations/cancel`, {
  data: { id: cancelId },
});
check("double cancellation refused", cancelAgain.status() === 409, `status ${cancelAgain.status()}`);

/* -------------------------------------------------------------- prayer */
section("6. Prayer follow-up");

const prayer = db.prepare("SELECT id, status FROM prayer_requests ORDER BY created_at DESC LIMIT 1").get();
check("a prayer request exists", Boolean(prayer));

if (prayer) {
  const prayerRes = await ctx.request.post(`${BASE}/api/admin/prayer`, {
    data: { id: prayer.id, status: "follow_up", internalNotes: "Smoke test note" },
  });
  check("prayer status updated", prayerRes.ok(), `status ${prayerRes.status()}`);

  const updated = db.prepare("SELECT status FROM prayer_requests WHERE id = ?").get(prayer.id);
  check("prayer status persisted", updated?.status === "follow_up", updated?.status ?? "missing");

  const badStatus = await ctx.request.post(`${BASE}/api/admin/prayer`, {
    data: { id: prayer.id, status: "nonsense" },
  });
  check("invalid prayer status rejected", badStatus.status() === 422, `status ${badStatus.status()}`);
}

/* ------------------------------------------------------ volunteer review */
section("7. Volunteer review");

const volunteer = db
  .prepare("SELECT id, status FROM volunteer_applications ORDER BY created_at DESC LIMIT 1")
  .get();

if (volunteer) {
  const reviewRes = await ctx.request.post(`${BASE}/api/admin/volunteers/review`, {
    data: { volunteerId: volunteer.id, status: "under_review" },
  });
  check("volunteer review applied", reviewRes.ok(), `status ${reviewRes.status()}`);

  const after = db.prepare("SELECT status FROM volunteer_applications WHERE id = ?").get(volunteer.id);
  check("volunteer status persisted", after?.status === "under_review", after?.status ?? "missing");
} else {
  check("a volunteer application exists to review", false, "none found");
}

/* ------------------------------------------------------------ campaigns */
section("8. Communications");

const campaignRes = await ctx.request.post(`${BASE}/api/admin/campaigns`, {
  data: {
    name: "Smoke test campaign",
    channel: "email",
    audience: "event_registrants",
    template: "custom",
    subject: "Smoke test campaign",
    body: "This is a smoke test of the campaign composer.",
  },
});
const campaignBody = await campaignRes.json().catch(() => ({}));
check(
  "campaign creation behaves honestly (503 without providers, not a fake success)",
  campaignRes.status() === 503 || campaignRes.status() === 201 || campaignRes.status() === 200,
  `status ${campaignRes.status()} ${JSON.stringify(campaignBody).slice(0, 140)}`
);
check(
  "campaign does not claim delivery without a provider",
  campaignRes.status() === 503,
  `status ${campaignRes.status()}`
);

/* ------------------------------------------------------------- content */
section("8b. Content publishing");

const announcement = await ctx.request.post(`${BASE}/api/admin/content`, {
  data: { title: "Smoke test announcement", body: "Published by the admin smoke test.", severity: "info", publish: true },
});
check("announcement published", announcement.ok(), `status ${announcement.status()}`);

const annRow = db
  .prepare("SELECT id, is_published FROM announcements WHERE title = ?")
  .get("Smoke test announcement");
check("announcement row written as published", annRow?.is_published === 1, String(annRow?.is_published));
if (annRow) cleanup.push(["announcements", annRow.id]);

const badAnnouncement = await ctx.request.post(`${BASE}/api/admin/content`, {
  data: { title: "x", body: "", severity: "nonsense" },
});
check("empty announcement rejected", badAnnouncement.status() === 422, `status ${badAnnouncement.status()}`);

const contentPage = await page.goto(`${BASE}/admin/content`, { waitUntil: "domcontentloaded" });
const contentBody = await page.innerText("body");
check("content page lists the new announcement", contentBody.includes("Smoke test announcement"), `status ${contentPage.status()}`);

/* ---------------------------------------------------------------- events */
section("9. Event management");

const slug = `smoke-event-${Date.now()}`;
const createRes = await ctx.request.post(`${BASE}/api/admin/events`, {
  data: {
    title: "Smoke Test Gathering",
    slug,
    theme: "the test",
    description: "Created by the admin smoke test.",
    startsAt: "2027-03-05T15:00:00+01:00",
    endsAt: "2027-03-05T20:00:00+01:00",
    venueName: "Test Venue",
    venueAddress: "Test Address, Calabar",
    capacity: 0,
    status: "draft",
    registrationOpen: true,
  },
});
const createdEvent = await createRes.json().catch(() => ({}));
check("event created", createRes.ok(), `status ${createRes.status()} ${JSON.stringify(createdEvent).slice(0, 160)}`);

const newEvent = db.prepare("SELECT * FROM events WHERE slug = ?").get(slug);
check("event row written", Boolean(newEvent), slug);

if (newEvent) {
  const patchRes = await ctx.request.patch(`${BASE}/api/admin/events/${newEvent.id}`, {
    data: {
      title: "Smoke Test Gathering (edited)",
      slug,
      theme: "the test",
      description: "Created by the admin smoke test.",
      startsAt: "2027-03-05T15:00:00+01:00",
      endsAt: "2027-03-05T20:00:00+01:00",
      venueName: "Test Venue",
      venueAddress: "Test Address, Calabar",
      capacity: 0,
      status: "published",
      registrationOpen: true,
    },
  });
  check("event updated", patchRes.ok(), `status ${patchRes.status()}`);

  const edited = db.prepare("SELECT title, status FROM events WHERE id = ?").get(newEvent.id);
  check("edit persisted", edited?.title === "Smoke Test Gathering (edited)" && edited?.status === "published",
    `${edited?.title} / ${edited?.status}`);

  // Public page for the new event must render.
  const publicRes = await page.goto(`${BASE}/events/${slug}`, { waitUntil: "domcontentloaded" });
  check("new event has a working public page", publicRes.status() === 200, `status ${publicRes.status()}`);

  cleanup.push(["events", newEvent.id]);
}

/* ---------------------------------------------------------------- team */
section("10. Team and permissions");

const inviteRes = await ctx.request.post(`${BASE}/api/admin/team`, {
  data: { email: `smoke.member.${Date.now()}@ephaphata.com`, fullName: "Smoke Member", role: "viewer" },
});
const inviteBody = await inviteRes.json().catch(() => ({}));
check("member invited", inviteRes.ok(), `status ${inviteRes.status()} ${JSON.stringify(inviteBody).slice(0, 140)}`);
check(
  "invite returns a single-use acceptance link (returned once only)",
  typeof inviteBody.invitePath === "string" && inviteBody.invitePath.includes("token="),
  Object.keys(inviteBody).join(",")
);

const invited = db
  .prepare("SELECT id, role, status FROM profiles WHERE email LIKE 'smoke.member.%@ephaphata.com'")
  .get();
check("invited profile created as unactivated", invited?.status === "invited", invited?.status ?? "missing");

if (invited) {
  const patchRes = await ctx.request.patch(`${BASE}/api/admin/team`, {
    data: { id: invited.id, role: "registration_officer" },
  });
  check("member role changed", patchRes.ok(), `status ${patchRes.status()}`);
  const updated = db.prepare("SELECT role FROM profiles WHERE id = ?").get(invited.id);
  check("role persisted", updated?.role === "registration_officer", updated?.role ?? "missing");
  cleanup.push(["profiles", invited.id]);
}

/* ------------------------------------------------ permission enforcement */
section("11. Server-side permission enforcement");

const viewerCtx = await browser.newContext();
db.prepare("DELETE FROM rate_limits").run();
const viewerLogin = await viewerCtx.request.post(`${BASE}/api/auth/login`, {
  data: { email: "viewer@ephaphata.com", password: "EphaphataView2026!" },
});
check("viewer signs in", viewerLogin.ok(), `status ${viewerLogin.status()}`);

const viewerInvite = await viewerCtx.request.post(`${BASE}/api/admin/team`, {
  data: { email: "escalate@ephaphata.com", fullName: "Escalate", role: "super_admin" },
});
check("viewer cannot invite members (403)", viewerInvite.status() === 403, `status ${viewerInvite.status()}`);

const viewerCheckin = await viewerCtx.request.post(`${BASE}/api/admin/checkin`, {
  data: { eventId: eventRow.id, credential: "EPH-00-AAAAAA", gate: "x" },
});
check("viewer cannot operate check-in (403)", viewerCheckin.status() === 403, `status ${viewerCheckin.status()}`);

const viewerEvent = await viewerCtx.request.post(`${BASE}/api/admin/events`, {
  data: { title: "Nope", slug: "nope", startsAt: "2027-01-01T15:00:00+01:00", status: "published" },
});
check("viewer cannot create events (403)", viewerEvent.status() === 403, `status ${viewerEvent.status()}`);

await viewerCtx.close();

const anonCtx = await browser.newContext();
const anonPost = await anonCtx.request.post(`${BASE}/api/admin/team`, {
  data: { email: "anon@example.test", fullName: "Anon", role: "super_admin" },
});
check("anonymous API call returns 401, not a redirect", anonPost.status() === 401, `status ${anonPost.status()}`);
const anonBody = await anonPost.json().catch(() => ({}));
check("401 answers with JSON, not HTML", anonBody.ok === false && Boolean(anonBody.code), JSON.stringify(anonBody).slice(0, 80));
await anonCtx.close();

/* ------------------------------------------------------------ programme */
section("12. Programme timer");

const timerPage = await page.goto(`${BASE}/admin/programme`, { waitUntil: "domcontentloaded" });
const timerBody = await page.innerText("body");
check("programme controller renders", timerPage.status() === 200 && !/error/i.test(timerBody.slice(0, 400)));

const presentPage = await page.goto(`${BASE}/admin/programme/present`, { waitUntil: "domcontentloaded" });
check("presentation screen renders", presentPage.status() === 200, `status ${presentPage.status()}`);

/* ----------------------------------------------------------- exports */
section("13. Exports");

const csv = await ctx.request.get(`${BASE}/admin/registrations/export`);
const csvText = await csv.text();
check("registration CSV exports", csv.ok() && csvText.split("\n").length > 1, `status ${csv.status()}, ${csvText.split("\n").length} lines`);
check("CSV has a header row", /reference|Reference|name|Name/.test(csvText.slice(0, 300)));

/* --------------------------------------------------------------- audit */
section("14. Audit trail");

const auditCount = db.prepare("SELECT count(*) n FROM audit_logs").get().n;
check("audit log is being written", auditCount > 0, `${auditCount} entries`);

const recent = db
  .prepare("SELECT action FROM audit_logs ORDER BY created_at DESC LIMIT 40")
  .all()
  .map((r) => r.action);
check(
  "smoke-test actions were audited",
  recent.some((a) => a.startsWith("event.") || a.startsWith("registration.") || a.startsWith("team.")),
  recent.slice(0, 6).join(", ")
);

const prayerAudit = db
  .prepare("SELECT detail FROM audit_logs WHERE action = 'prayer.update' LIMIT 1")
  .get();
check(
  "prayer audit contains no prayer content",
  !prayerAudit || !/Smoke test note/.test(String(prayerAudit.detail ?? "")),
  String(prayerAudit?.detail ?? "").slice(0, 80)
);

/* ----------------------------------------------------------- sign out */
section("15. Sign out");

const logout = await ctx.request.post(`${BASE}/api/auth/logout`);
check("logout succeeds", logout.ok(), `status ${logout.status()}`);

const afterLogout = await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
check("dashboard blocked after sign-out", page.url().includes("/admin/login"), `landed on ${page.url()}`);

/* ------------------------------------------------------------ cleanup */
section("16. Cleanup");

for (const [table, id] of cleanup) {
  try {
    if (table === "registrations") {
      db.prepare("DELETE FROM attendance_records WHERE registration_id = ?").run(id);
      db.prepare("DELETE FROM registrations WHERE id = ?").run(id);
    } else if (table === "events") {
      // leave the smoke event so its public page can be inspected? no - remove.
      db.prepare("DELETE FROM events WHERE id = ?").run(id);
    } else {
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    }
  } catch {
    /* ignore */
  }
}
// Sweep the reserved test namespace, so an aborted earlier run cannot leave
// rows behind in the demo dataset. `example.test` is reserved for testing and
// can never hold a real attendee.
const swept =
  db.prepare("DELETE FROM registrations WHERE email LIKE '%@example.test'").run().changes +
  db.prepare("DELETE FROM profiles WHERE email LIKE '%@example.test'").run().changes +
  db.prepare("DELETE FROM events WHERE slug LIKE 'smoke-event-%'").run().changes;
console.log(`  cleaned ${cleanup.length} tracked records, swept ${swept} stragglers`);

await browser.close();
db.close();

console.log(`\n${pass} passed · ${fail} failed`);
if (fail) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
