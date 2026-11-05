import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await p.addStyleTag({ content: "html{scroll-behavior:auto !important}" });
await p.waitForTimeout(1200);
const shots = [
  ["hero", 0],
  ["intro", 900],
  ["about", 1800],
  ["ministers", 2900],
  ["cta", 4300],
];
for (const [name, y] of shots) {
  await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `qa/zoom-${name}.png` });
}
await b.close();
