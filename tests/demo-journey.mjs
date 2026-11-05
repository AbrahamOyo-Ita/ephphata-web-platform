/**
 * The complete demo journey, exercised through the real UI with a browser.
 *
 *   1. Visit the public event page → register through the form
 *   2. Land on the confirmation page → capture the reference + QR
 *   3. Sign in to the admin app
 *   4. Find the new registration in the admin list
 *   5. Open the check-in desk and check the attendee in by reference
 *   6. Confirm the attendance counter increased and the duplicate is refused
 *
 *   node tests/demo-journey.mjs
 */
import { chromium } from "playwright";
import Database from "better-sqlite3";
import path from "node:path";
import { randomUUID } from "node:crypto";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "qa/journey";
let pass = 0;
let fail = 0;

function step(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e)));

const suffix = randomUUID().slice(0, 6);
const email = `journey.${suffix}@example.com`;
const firstName = "Journey";
// Letters only — the form validates names strictly, which is correct.
const lastName = "Journeytest";

try {
  /* ── 1. Public registration ──────────────────────────────── */
  console.log("\n1. Public registration");
  await page.goto(`${BASE}/events/ephaphata-unical-2026/register`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");

  await page.getByLabel(/first name/i).fill(firstName);
  await page.getByLabel(/last name/i).fill(lastName);
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/phone/i).first().fill("08031234567");
  // Required consents: privacy notice, plus event emails.
  const privacy = page.getByRole("checkbox", { name: /privacy notice/i });
  if (await privacy.count()) await privacy.check();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/01-register-filled.png`, fullPage: true });

  await page.getByRole("button", { name: /complete registration|register/i }).first().click();
  await page.waitForURL(/register\/success/, { timeout: 25000 });
  step("form submitted and redirected to confirmation", true);

  /* ── 2. Confirmation + QR ────────────────────────────────── */
  console.log("\n2. Confirmation page");
  const bodyText = await page.locator("body").innerText();
  const refMatch = bodyText.match(/EPH-\d{2}-[A-Z0-9]{4,10}/);
  const reference = refMatch?.[0] ?? "";
  step("reference rendered", Boolean(reference), reference || "no reference found");
  step("QR code rendered", (await page.locator("svg").count()) > 0);
  step("name shown on confirmation", bodyText.includes(firstName));
  await page.screenshot({ path: `${OUT}/02-confirmation.png`, fullPage: true });

  /* ── 3. Admin sign-in ────────────────────────────────────── */
  console.log("\n3. Admin sign-in");
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await page.screenshot({ path: `${OUT}/03-login.png`, fullPage: true });

  await page.getByLabel(/email/i).fill("admin@ephaphata.com");
  await page.getByLabel(/^password$/i).fill("EphaphataAdmin2026!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => u.pathname === "/admin", { timeout: 25000 });
  step("signed in and landed on the dashboard", true);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/04-dashboard.png`, fullPage: true });

  /* ── 4. Find the registration ────────────────────────────── */
  console.log("\n4. Registration visible in admin");
  await page.goto(`${BASE}/admin/registrations?q=${encodeURIComponent(email)}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("load");
  await page.waitForTimeout(600);
  const listText = await page.locator("body").innerText();
  step("new registration appears in the admin list", listText.includes(reference), `looking for ${reference}`);
  step("email visible in the list", listText.includes(email));

  const beforeCheckin = Number(
    (await page.goto(`${BASE}/admin/checkin`, { waitUntil: "domcontentloaded" })) ? 0 : 0
  );
  await page.waitForLoadState("load");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/05-registrations.png`, fullPage: true });
  const checkinBody = await page.locator("body").innerText();
  const countMatch = checkinBody.match(/(\d+)\s*\/\s*(\d+)/);
  const checkedInBefore = countMatch ? Number(countMatch[1]) : 0;

  /* ── 5. Check in by reference ────────────────────────────── */
  console.log("\n5. Check-in");
  const input = page.locator("#credential");
  await input.fill(reference);
  await page.getByRole("button", { name: /check in/i }).click();
  await page.waitForTimeout(1800);

  const afterText = await page.locator("body").innerText();
  step("successful check-in reported", /checked in successfully/i.test(afterText));
  step("attendee name shown on the outcome card", afterText.includes(firstName));
  step("no duplicate attendance note yet", !/already checked in/i.test(afterText));
  await page.screenshot({ path: `${OUT}/06-checkin-success.png`, fullPage: true });

  const countAfter = afterText.match(/(\d+)\s*\/\s*(\d+)/);
  const checkedInAfter = countAfter ? Number(countAfter[1]) : 0;
  step(
    "live attendance counter increased",
    checkedInAfter === checkedInBefore + 1,
    `${checkedInBefore} → ${checkedInAfter}`
  );

  /* ── 6. Duplicate refused ────────────────────────────────── */
  console.log("\n6. Duplicate scan refused");
  await input.fill(reference);
  await page.getByRole("button", { name: /check in/i }).click();
  await page.waitForTimeout(1600);
  const dupText = await page.locator("body").innerText();
  step("duplicate reported as already checked in", /already checked in/i.test(dupText));
  step("no second attendance record noted", /no duplicate attendance record/i.test(dupText));
  await page.screenshot({ path: `${OUT}/07-checkin-duplicate.png`, fullPage: true });

  /* ── 7. Bogus credential ─────────────────────────────────── */
  console.log("\n7. Invalid credential");
  await input.fill("EPH-26-BOGUS1");
  await page.getByRole("button", { name: /check in/i }).click();
  await page.waitForTimeout(1500);
  const badText = await page.locator("body").innerText();
  step("invalid credential rejected", /not recognised/i.test(badText));
  await page.screenshot({ path: `${OUT}/08-checkin-invalid.png`, fullPage: true });

  /* ── 8. Attendance reflected in the registration detail ──── */
  console.log("\n8. Attendance persisted");
  await page.goto(`${BASE}/admin/registrations?q=${encodeURIComponent(email)}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("load");
  await page.waitForTimeout(500);
  const detailText = await page.locator("body").innerText();
  step("registration now shows checked-in state", /checked in/i.test(detailText));

  step("no uncaught browser errors", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
} catch (e) {
  fail += 1;
  console.log(`\n  ✗ journey broke: ${String(e).split("\n")[0]}`);
  await page.screenshot({ path: `${OUT}/error.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
  // Remove the attendee this run created so repeated runs do not inflate the
  // demo dataset. Production data is never touched: only the test run's own
  // address is deleted.
  try {
    const cleanupDb = new Database(process.env.DATABASE_PATH ?? path.join("data", "ephaphata.db"));
    const row = cleanupDb.prepare("SELECT id FROM registrations WHERE email = ?").get(email);
    if (row) {
      cleanupDb.prepare("DELETE FROM attendance_records WHERE registration_id = ?").run(row.id);
      cleanupDb.prepare("DELETE FROM registrations WHERE id = ?").run(row.id);
      console.log(`  cleaned up test registration ${email}`);
    }
    cleanupDb.close();
  } catch {
    /* cleanup is best-effort */
  }
}

console.log(`\n${pass} passed · ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
