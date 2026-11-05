/**
 * Admin visual QA — signs in, screenshots every admin screen at desktop and
 * mobile widths, and flags horizontal overflow.
 *
 *   node scripts/qa-admin.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "qa/admin";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["login", "/admin/login", false],
  ["dashboard", "/admin", true],
  ["registrations", "/admin/registrations", true],
  ["registration-new", "/admin/registrations/new", true],
  ["checkin", "/admin/checkin", true],
  ["volunteers", "/admin/volunteers", true],
  ["events", "/admin/events", true],
  ["event-detail", "/admin/events/EVENT_ID", true],
  ["prayer", "/admin/prayer", true],
  ["audience", "/admin/audience", true],
  ["communications", "/admin/communications", true],
  ["programme", "/admin/programme", true],
  ["present", "/admin/programme/present", true],
  ["content", "/admin/content", true],
  ["analytics", "/admin/analytics", true],
  ["team", "/admin/team", true],
  ["audit", "/admin/audit", true],
  ["settings", "/admin/settings", true],
];

const browser = await chromium.launch();
const issues = [];

// sign in once
const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const authPage = await authCtx.newPage();
const loginRes = await authPage.request.post(`${BASE}/api/auth/login`, {
  data: { email: "admin@ephaphata.com", password: "EphaphataAdmin2026!" },
});
if (!loginRes.ok()) {
  console.error("Could not sign in:", loginRes.status(), await loginRes.text());
  process.exit(1);
}
const cookies = await authCtx.cookies();

// find a real event id for the detail route
let eventId = "";
try {
  const res = await authCtx.request.get(`${BASE}/admin/events`);
  const html = await res.text();
  const match = html.match(/\/admin\/events\/([0-9a-f-]{36})/);
  if (match) eventId = match[1];
} catch {
  /* fall through */
}
await authCtx.close();

for (const [name, path, needsAuth] of ROUTES) {
  const target = path.replace("EVENT_ID", eventId || "missing");

  for (const [label, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    if (needsAuth) await ctx.addCookies(cookies);

    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().includes("_rsc=")) {
        errors.push(`${r.status()} ${r.url()}`);
      }
    });

    try {
      const res = await page.goto(BASE + target, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("load").catch(() => {});
      await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" }).catch(() => {});
      await page.waitForTimeout(1100);

      const status = res?.status() ?? 0;
      const docWidth = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (docWidth > 2) issues.push(`${name} @${label}: horizontal overflow ${docWidth}px`);
      if (status >= 400) issues.push(`${name} @${label}: HTTP ${status}`);

      await page.screenshot({
        path: `${OUT}/${name}-${label}.png`,
        fullPage: label === "desktop",
      });

      const real = errors.filter((e) => !/favicon|_rsc=/.test(e));
      if (real.length) issues.push(`${name} @${label}: ${real.slice(0, 3).join(" | ")}`);
    } catch (e) {
      issues.push(`${name} @${label}: ${String(e).split("\n")[0]}`);
    } finally {
      await ctx.close();
    }
  }
  console.log(`  shot ${name}`);
}

await browser.close();

console.log(`\n${issues.length} issues`);
for (const i of issues) console.log("  ! " + i);
