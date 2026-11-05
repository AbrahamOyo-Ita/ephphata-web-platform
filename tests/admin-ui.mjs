/**
 * Admin UI driver
 * ------------------------------------------------------------------
 * Exercises the dashboard through the browser - real clicks, real form fills,
 * real submits - so a broken button, a dead handler or a silently failing
 * fetch is caught even when the API underneath is healthy.
 *
 *   node tests/admin-ui.mjs
 *
 * The API contract suite (tests/admin-smoke.mjs) covers the same operations at
 * the HTTP layer; this one covers the layer the operator actually touches.
 */
import { chromium } from "playwright";
import Database from "better-sqlite3";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const DB_PATH = process.env.DATABASE_PATH ?? path.join("data", "ephaphata.db");
const OUT = process.env.SHOT_DIR ?? "qa/admin-ui";
const db = new Database(DB_PATH);

// A clean limiter, otherwise sign-in 429s and every screenshot comes back blank.
db.prepare("DELETE FROM rate_limits").run();

let pass = 0;
let fail = 0;
const failures = [];
const consoleErrors = [];

function check(label, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    failures.push(`${label}${detail ? ` - ${detail}` : ""}`);
    console.log(`  ✗ ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

const section = (t) => console.log(`\n${t}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error" && !/favicon|404 \(Not Found\)/i.test(m.text())) {
    consoleErrors.push(`console: ${m.text().slice(0, 160)}`);
  }
});

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });

/* ------------------------------------------------------------ sign in */
section("1. Sign in through the form");
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.locator("#email").fill("admin@ephaphata.com");
await page.locator("#password").fill("EphaphataAdmin2026!");
await page.locator('button[type="submit"]').click();
await page.waitForURL("**/admin", { timeout: 20000 }).catch(() => {});
check("form sign-in lands on the dashboard", /\/admin$/.test(new URL(page.url()).pathname), page.url());
await shot("01-dashboard");

const shellText = await page.locator("body").innerText();
check("shell renders navigation", /registrations/i.test(shellText) && /check-?in/i.test(shellText));

/* ------------------------------------------------------- navigation */
section("2. Every sidebar destination is reachable by clicking");

const destinations = [
  ["Registrations", "/admin/registrations"],
  ["Volunteers", "/admin/volunteers"],
  ["Prayer", "/admin/prayer"],
  ["Audience", "/admin/audience"],
  ["Communications", "/admin/communications"],
  ["Content", "/admin/content"],
  ["Programme", "/admin/programme"],
  ["Analytics", "/admin/analytics"],
  ["Team", "/admin/team"],
  ["Audit", "/admin/audit"],
  ["Settings", "/admin/settings"],
  ["Events", "/admin/events"],
];

for (const [label, expected] of destinations) {
  const link = page.locator(`nav a:has-text("${label}"), aside a:has-text("${label}")`).first();
  const count = await link.count();
  if (!count) {
    check(`nav link "${label}" exists`, false, "not found in the shell");
    continue;
  }
  await link.click();
  await page.waitForTimeout(700);
  const body = await page.locator("body").innerText();
  const pathname = new URL(page.url()).pathname;
  check(
    `nav "${label}" opens ${expected}`,
    pathname === expected && !/Application error|Internal Server Error/i.test(body),
    `${pathname}`
  );
}
await shot("02-navigation");

/* --------------------------------------------------- create an event */
section("3. Create an event with the form");

const slug = `ui-event-${Date.now()}`;
await page.goto(`${BASE}/admin/events/new`, { waitUntil: "domcontentloaded" });
await page.locator("#title").fill("UI Driven Gathering");
await page.locator("#slug").fill(slug);
await page.locator("#startsAt").fill("2027-08-14T15:00");
await page.locator("#endsAt").fill("2027-08-14T20:00");
await page.locator("#venueName").fill("UI Test Hall");
await page.locator("#venueAddress").fill("12 Test Road, Calabar");
await page.locator("#status").selectOption("draft");
await shot("03-event-form");
await page.locator('button[type="submit"]').click();
// The form redirects to the event's own page once the record is written.
await page.waitForURL(/\/admin\/events\/[^/]+$/, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(800);

const createdEvent = db.prepare("SELECT * FROM events WHERE slug = ?").get(slug);
check("form submit wrote the event", Boolean(createdEvent), slug);
if (createdEvent) {
  await shot("04-event-created");
  check(
    "form redirects to the saved event",
    new URL(page.url()).pathname === `/admin/events/${createdEvent.id}`,
    new URL(page.url()).pathname
  );
  // The detail heading is rendered uppercase by CSS, so compare case-insensitively.
  const afterText = (await page.locator("body").innerText()).toLowerCase();
  check("the saved event is shown", afterText.includes("ui driven gathering"), afterText.slice(0, 80).replace(/\n/g, " | "));
  check(
    "a draft offers a public preview without publishing",
    (await page.getByRole("link", { name: /view public page/i }).count()) > 0
  );
  // The new draft must not be public.
  const publicRes = await page.goto(`${BASE}/events/${slug}`, { waitUntil: "domcontentloaded" });
  check("a draft stays off the public site", publicRes.status() === 404, `status ${publicRes.status()}`);
}

/* ------------------------------------------------ edit and publish it */
section("4. Edit, publish, then unpublish");

if (createdEvent) {
  await page.goto(`${BASE}/admin/events/${createdEvent.id}`, { waitUntil: "domcontentloaded" });
  const titleField = page.locator("#title");
  check("edit form is prefilled", (await titleField.inputValue()) === "UI Driven Gathering");
  await titleField.fill("UI Driven Gathering (published)");
  await page.locator("#status").selectOption("published");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);

  const edited = db.prepare("SELECT title, status FROM events WHERE id = ?").get(createdEvent.id);
  check("edit persisted the new title", edited?.title === "UI Driven Gathering (published)", edited?.title ?? "missing");
  check("status moved to published", edited?.status === "published", edited?.status ?? "missing");

  const liveRes = await page.goto(`${BASE}/events/${slug}`, { waitUntil: "domcontentloaded" });
  check("published event is publicly visible", liveRes.status() === 200, `status ${liveRes.status()}`);
  await shot("05-event-published");
}

/* ------------------------------------------- manual registration form */
section("5. Manual registration through the desk form");

// Registrations are created from the event detail or the registrations page.
await page.goto(`${BASE}/admin/registrations`, { waitUntil: "domcontentloaded" });
const addLink = page.getByRole("link", { name: /register attendee|new registration/i }).first();
check("a manual-registration entry point exists on the registrations page", (await addLink.count()) > 0, "no link found");
if ((await addLink.count()) > 0) {
  await addLink.click();
  await page.waitForURL("**/admin/registrations/new**", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shot("06-manual-form");
  const formText = await page.locator("body").innerText();
  check("manual registration form opened", /first name|full name/i.test(formText), new URL(page.url()).pathname);
  check("form asks for the required consent", /privacy|consent/i.test(formText));

  // Fill and submit it end to end.
  const email = `ui.manual.${Date.now()}@example.test`;
  await page.locator("#firstName").fill("Ui");
  await page.locator("#lastName").fill("Manual");
  await page.locator("#email").fill(email);
  await page.locator("#phone").fill("08031234567");
  const consent = page.locator('input[type="checkbox"]').last();
  if (await consent.count()) await consent.check().catch(() => {});
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2500);
  const written = db.prepare("SELECT id, reference FROM registrations WHERE email = ?").get(email);
  check("desk registration wrote the row", Boolean(written), email);
  if (written) {
    await shot("06b-manual-created");
    const okText = await page.locator("body").innerText();
    check("desk shows the new reference", written.reference ? okText.includes(written.reference) : false, written.reference);
    db.prepare("DELETE FROM registrations WHERE id = ?").run(written.id);
  }
}

/* -------------------------------------------------------- check-in */
section("6. Check-in console behaviour");

const target = db
  .prepare(
    `SELECT r.id, r.reference FROM registrations r
      LEFT JOIN attendance_records a ON a.registration_id = r.id
     WHERE a.id IS NULL AND r.status = 'confirmed' AND r.deleted_at IS NULL
     LIMIT 1`
  )
  .get();
check("an unchecked-in attendee is available", Boolean(target), "none");

if (target) {
  await page.goto(`${BASE}/admin/checkin`, { waitUntil: "domcontentloaded" });
  await page.locator("#credential").fill(target.reference);
  await page.getByRole("button", { name: /check in/i }).click();
  await page.waitForTimeout(2000);
  const text = await page.locator("body").innerText();
  check("console reports success", /checked in successfully/i.test(text), text.slice(0, 120).replace(/\n/g, " | "));
  const rows = db.prepare("SELECT count(*) n FROM attendance_records WHERE registration_id = ?").get(target.id).n;
  check("attendance recorded once", rows === 1, `${rows} rows`);
  await shot("07-checkin");

  await page.locator("#credential").fill(target.reference);
  await page.getByRole("button", { name: /check in/i }).click();
  await page.waitForTimeout(1800);
  const dupText = await page.locator("body").innerText();
  check("repeat scan says already checked in", /already checked in/i.test(dupText));
  const rowsAfter = db.prepare("SELECT count(*) n FROM attendance_records WHERE registration_id = ?").get(target.id).n;
  check("repeat scan wrote nothing", rowsAfter === 1, `${rowsAfter} rows`);

  // Undo the check-in so repeated runs leave the demo attendance figures as they
  // were. The console itself never removes attendance - this is test cleanup.
  db.prepare("DELETE FROM attendance_records WHERE registration_id = ?").run(target.id);
  console.log("  reverted the check-in made by this run");

  await page.locator("#credential").fill("EPH-00-NOTREAL");
  await page.getByRole("button", { name: /check in/i }).click();
  await page.waitForTimeout(1500);
  const badText = await page.locator("body").innerText();
  check("unknown credential is rejected visibly", /not recognised|could not|invalid/i.test(badText));
}

/* ------------------------------------------------------ volunteers */
section("7. Volunteer review through the panel");

await page.goto(`${BASE}/admin/volunteers`, { waitUntil: "domcontentloaded" });
const volunteer = db.prepare("SELECT id, status FROM volunteer_applications ORDER BY created_at DESC LIMIT 1").get();
const reviewLink = page.locator('a[href^="/admin/volunteers/"]').first();
check("volunteers page opens an application", (await reviewLink.count()) > 0, "no application link");
if ((await reviewLink.count()) > 0) {
  await reviewLink.click();
  await page.waitForTimeout(1200);
  await shot("08-volunteer-review");
  const panelText = await page.locator("body").innerText();
  check("review panel exposes a decision", /accept|shortlist|decline|under review/i.test(panelText));
  const before = db.prepare("SELECT id, status FROM volunteer_applications WHERE id = ?").get(
    new URL(page.url()).pathname.split("/").pop()
  );
  const decision = page.getByRole("button", { name: /save|update/i }).first();
  if (before && (await page.locator("#status").count()) > 0) {
    const next = before.status === "under_review" ? "accepted" : "under_review";
    await page.locator("#status").selectOption(next);
    await decision.click();
    await page.waitForTimeout(2200);
    const after = db.prepare("SELECT status FROM volunteer_applications WHERE id = ?").get(before.id);
    check("a decision in the panel changes the record", after?.status !== before.status, `${before.status} → ${after?.status}`);
    // Put it back so the demo dataset is unchanged.
    db.prepare("UPDATE volunteer_applications SET status = ? WHERE id = ?").run(before.status, before.id);
  } else {
    check("a decision in the panel changes the record", false, "no decision button");
  }
}

/* --------------------------------------------------------- prayer */
section("8. Prayer list actions");

await page.goto(`${BASE}/admin/prayer`, { waitUntil: "domcontentloaded" });
await shot("09-prayer");
const prayerText = await page.locator("body").innerText();
check("prayer page renders requests or an empty state", /prayer|request/i.test(prayerText));
const prayerButtons = await page.locator("button").count();
check("prayer page has interactive controls", prayerButtons > 0, `${prayerButtons} buttons`);

/* ----------------------------------------------------- campaigns */
section("9. Campaign composer");

await page.goto(`${BASE}/admin/communications`, { waitUntil: "domcontentloaded" });
await shot("10-communications");
const commText = await page.locator("body").innerText();
check("communications page renders", /campaign|audience|channel/i.test(commText));
const nameField = page.locator("#name, input[name='name']").first();
check("composer form is present", (await nameField.count()) > 0, "no name field");

if ((await nameField.count()) > 0) {
  await nameField.fill("UI smoke campaign");
  const subjectField = page.locator("#subject, input[name='subject']").first();
  if (await subjectField.count()) await subjectField.fill("UI smoke subject");
  const bodyField = page.locator("textarea").first();
  if (await bodyField.count()) await bodyField.fill("This campaign body is long enough to pass validation.");

  // With no email/WhatsApp provider configured the composer must say so and
  // refuse to send - a disabled button is the correct state, not a bug.
  const sendButton = page.getByRole("button", { name: /send|create|queue/i }).first();
  const disabled = await sendButton.isDisabled();
  const panelText = await page.locator("body").innerText();
  check("composer explains the missing provider", /not configured/i.test(panelText));
  check("send is blocked until a provider exists", disabled, disabled ? "" : "button was enabled");
  await shot("10b-campaign-result");
}

/* -------------------------------------------------- team invitation */
section("10. Team invitation");

await page.goto(`${BASE}/admin/team`, { waitUntil: "domcontentloaded" });
await shot("11-team");
const emailField = page.locator("#inv-email").first();
check("team page exposes an invite form", (await emailField.count()) > 0);
if ((await emailField.count()) > 0) {
  const inviteEmail = `ui.invite.${Date.now()}@example.test`;
  await emailField.fill(inviteEmail);
  await page.locator("#inv-name").fill("Ui Invite");
  await page.locator("#inv-role").selectOption("viewer");
  await page.getByRole("button", { name: /create invitation/i }).first().click();
  await page.waitForTimeout(2200);
  const invited = db.prepare("SELECT id, status FROM profiles WHERE email = ?").get(inviteEmail);
  check("invitation written to the team", Boolean(invited), inviteEmail);
  const teamText = await page.locator("body").innerText();
  check("acceptance link is surfaced once", /accept-invite|invitation link|copy/i.test(teamText));
  await shot("11b-team-invited");
  if (invited) {
    db.prepare("DELETE FROM profiles WHERE id = ?").run(invited.id);
  }
}

/* --------------------------------------------- read a registration */
section("11. Registration detail and export");

const sample = db.prepare("SELECT id, reference FROM registrations ORDER BY created_at DESC LIMIT 1").get();
if (sample) {
  const res = await page.goto(`${BASE}/admin/registrations/${sample.id}`, { waitUntil: "domcontentloaded" });
  const body = await page.locator("body").innerText();
  check("registration detail page loads", res.status() === 200 && body.includes(sample.reference), `status ${res.status()}`);
  check("consent panel shows real values", /granted|not granted/i.test(body));
  check("cancel action is offered", /cancel/i.test(body));
  await shot("12-registration-detail");
}

/* ------------------------------------------------ forbidden page */
section("12. Access-denied page for a limited role");

const viewerPage = await ctx.newPage();
db.prepare("DELETE FROM rate_limits").run();
const viewerCtx = await browser.newContext();
const vp = await viewerCtx.newPage();
await vp.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await vp.locator("#email").fill("viewer@ephaphata.com");
await vp.locator("#password").fill("EphaphataView2026!");
await vp.locator('button[type="submit"]').click();
await vp.waitForURL("**/admin", { timeout: 20000 }).catch(() => {});
check("viewer can sign in", /\/admin$/.test(new URL(vp.url()).pathname), vp.url());

const forbidden = await vp.goto(`${BASE}/admin/team`, { waitUntil: "domcontentloaded" });
const forbiddenBody = await vp.locator("body").innerText();
check("wrong-role page is caught, not a 404", /do not have access|no access/i.test(forbiddenBody), `status ${forbidden.status()}`);
await vp.screenshot({ path: `${OUT}/13-forbidden.png`, fullPage: true });
await viewerCtx.close();
await viewerPage.close();

/* ---------------------------------------------------------- cleanup */
if (createdEvent) {
  db.prepare("DELETE FROM events WHERE id = ?").run(createdEvent.id);
  console.log(`\n  cleaned the UI test event`);
}

section("Console health");
check("no uncaught browser errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

await browser.close();
db.close();

console.log(`\n${pass} passed · ${fail} failed`);
if (fail) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
