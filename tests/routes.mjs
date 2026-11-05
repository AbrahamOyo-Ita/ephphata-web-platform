/**
 * Full route sweep — public + authenticated admin.
 *
 * Signs in once with a super-admin session, then requests every admin route and
 * asserts 200. Public routes are checked anonymously. Reports any route that
 * throws, redirects unexpectedly, or returns an error status.
 *
 *   node tests/routes.mjs
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/events",
  "/events/ephaphata-unical-2026",
  "/events/ephaphata-unical-2026/register",
  "/volunteer",
  "/prayer",
  "/media",
  "/programme",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/register/success?ref=EPH-26-DOESNOTEXIST",
];

const ADMIN_ROUTES = [
  "/admin",
  "/admin/registrations",
  "/admin/registrations/new",
  "/admin/checkin",
  "/admin/volunteers",
  "/admin/events",
  "/admin/events/new",
  "/admin/prayer",
  "/admin/audience",
  "/admin/communications",
  "/admin/programme",
  "/admin/programme/present",
  "/admin/content",
  "/admin/analytics",
  "/admin/team",
  "/admin/audit",
  "/admin/settings",
];

const ANON_ROUTES = [
  "/robots.txt",
  "/sitemap.xml",
  "/icon.svg",
];

let pass = 0;
let fail = 0;

function report(ok, label, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`  ✓ ${label}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log(`\nRoute sweep against ${BASE}\n`);

console.log("Public routes");
for (const route of PUBLIC_ROUTES) {
  try {
    const res = await fetch(BASE + route, { redirect: "manual" });
    const body = await res.text();
    const ok = res.status === 200 && body.length > 500 && !/Application error|Internal Server Error/i.test(body);
    report(ok, `${res.status} ${route}`, ok ? "" : `${body.length} bytes`);
  } catch (e) {
    report(false, route, String(e));
  }
}

console.log("\nStatic assets & SEO");
for (const route of ANON_ROUTES) {
  try {
    const res = await fetch(BASE + route, { redirect: "manual" });
    report(res.status === 200, `${res.status} ${route}`);
  } catch (e) {
    report(false, route, String(e));
  }
}

console.log("\nAdmin route protection (anonymous)");
{
  const res = await fetch(`${BASE}/admin/registrations`, { redirect: "manual" });
  const loc = res.headers.get("location") ?? "";
  report(
    (res.status === 307 || res.status === 302) && loc.includes("/admin/login"),
    "anonymous admin access redirects to login",
    `${res.status} → ${loc}`
  );
}

console.log("\nAdmin routes (authenticated super admin)");
let cookie = "";
{
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ephaphata.com", password: "EphaphataAdmin2026!" }),
  });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  report(res.status === 200 && cookie.includes("eph_session"), "sign in", `status ${res.status}`);
}

for (const route of ADMIN_ROUTES) {
  try {
    const res = await fetch(BASE + route, { headers: { cookie }, redirect: "manual" });
    const body = await res.text();
    const isRedirect = res.status >= 300 && res.status < 400;
    const ok = res.status === 200 && body.length > 500 && !/Application error|Internal Server Error/i.test(body);
    report(ok, `${res.status} ${route}`, isRedirect ? `redirected to ${res.headers.get("location")}` : `${body.length} bytes`);
  } catch (e) {
    report(false, route, String(e));
  }
}

console.log(`\n${pass} passed · ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
