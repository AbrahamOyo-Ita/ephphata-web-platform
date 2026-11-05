import { NextResponse } from "next/server";
import { envSummary } from "@/lib/config";
import { site } from "@/lib/site";

/**
 * Deployment health check.
 * ------------------------------------------------------------------
 * Never returns secrets - only booleans and status labels. Point your host's
 * uptime monitor (or your own `curl`) at /api/health after deploying.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const env = envSummary();

  const checks = {
    database: { ok: false as boolean, detail: "unknown" },
    siteUrl: {
      ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim() && !site.url.includes("localhost")),
      detail: site.url,
    },
    security: { ok: env.sessionSecret && env.ipHashSalt, detail: "session and IP hashing secrets" },
    demoMode: { ok: !env.demoMode, detail: env.demoMode ? "enabled" : "disabled" },
  };

  try {
    // Imported lazily so a database failure degrades this endpoint instead of
    // crashing the whole route at build time.
    const { db } = await import("@/lib/db");
    const row = db.prepare("SELECT count(*) AS n FROM events").get() as { n: number };
    checks.database = { ok: true, detail: `${row.n} events` };
  } catch (error) {
    checks.database = {
      ok: false,
      detail: error instanceof Error ? error.message : "unavailable",
    };
  }

  const ok = checks.database.ok && checks.siteUrl.ok && checks.security.ok && checks.demoMode.ok;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      site: site.name,
      checks,
      integrations: {
        sessionSecret: env.sessionSecret,
        ipHashSalt: env.ipHashSalt,
        email: env.email,
        whatsapp: env.whatsapp,
        demoMode: env.demoMode,
      },
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
