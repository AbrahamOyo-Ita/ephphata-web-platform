/**
 * Visual QA harness — screenshots key routes at desktop + mobile widths and
 * reports console errors / failed requests. Run while the dev server is up:
 *   node scripts/qa-shots.mjs [--only=/path]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "qa";
await mkdir(OUT, { recursive: true });

const ROUTES = [
  ["home", "/"],
  ["about", "/about"],
  ["events", "/events"],
  ["event-detail", "/events/ephaphata-unical-2026"],
  ["register", "/events/ephaphata-unical-2026/register"],
  ["volunteer", "/volunteer"],
  ["prayer", "/prayer"],
  ["media", "/media"],
  ["contact", "/contact"],
  ["programme", "/programme"],
  ["faq", "/faq"],
  ["admin-login", "/admin/login"],
];

const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const routes = only ? ROUTES.filter(([, p]) => p === only) : ROUTES;

const browser = await chromium.launch();
let failures = 0;

for (const [name, path] of routes) {
  for (const [w, h, tag] of [
    [1440, 900, "desktop"],
    [390, 844, "mobile"],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 200));
    });
    page.on("requestfailed", (r) => {
      if (!r.url().includes("favicon") && !r.url().includes("_rsc=")) errors.push(`REQFAIL ${r.url().slice(0, 120)}`);
    });

    try {
      const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 45000 });
      const status = res?.status();
      await page.waitForLoadState("load").catch(() => {});
      await page.waitForTimeout(900);
      // Trigger scroll-reveal: step through the page with instant scrolling
      // (CSS scroll-behavior:smooth would swallow programmatic jumps).
      await page.addStyleTag({ content: "html{scroll-behavior:auto !important}" });
      await page.evaluate(async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const height = () => document.documentElement.scrollHeight;
        let y = 0;
        while (y < height()) {
          window.scrollTo({ top: y, behavior: "instant" });
          await sleep(70);
          y += window.innerHeight * 0.7;
        }
        window.scrollTo({ top: height(), behavior: "instant" });
        await sleep(400);
        window.scrollTo({ top: 0, behavior: "instant" });
        await sleep(300);
      });
      await page.waitForTimeout(600);

      if (w === 1440) {
        await page.screenshot({ path: `${OUT}/${name}-${tag}.png`, fullPage: true });
      } else {
        await page.screenshot({ path: `${OUT}/${name}-${tag}.png`, fullPage: false });
      }

      const hasHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2
      );

      const bad = status >= 400 || errors.length > 0 || hasHScroll;
      if (bad) failures += 1;
      console.log(
        `${bad ? "✗" : "✓"} ${name.padEnd(15)} ${tag.padEnd(8)} ${status}` +
          (hasHScroll ? "  ⚠ horizontal overflow" : "") +
          (errors.length ? `\n    ${errors.slice(0, 3).join("\n    ")}` : "")
      );
    } catch (e) {
      failures += 1;
      console.log(`✗ ${name} ${tag} EXCEPTION ${String(e).slice(0, 160)}`);
    }
    await page.close();
  }
}

await browser.close();
console.log(failures === 0 ? "\nAll routes clean." : `\n${failures} issue(s).`);
process.exit(failures === 0 ? 0 : 1);
