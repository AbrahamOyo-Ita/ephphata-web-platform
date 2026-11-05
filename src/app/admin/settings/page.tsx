import Link from "next/link";
import {
  Database,
  Mail,
  MessageCircle,
  KeyRound,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { emailConfigured, whatsappConfigured } from "@/lib/notifications";
import { site } from "@/lib/site";
import { isSeeded } from "@/lib/db";
import { DEMO_MODE, DEMO_ACCOUNTS } from "@/lib/demo";
import { envSummary } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireUser("settings.manage");

  const checks = envSummary();

  const integrations = [
    {
      name: "Email delivery",
      Icon: Mail,
      ready: emailConfigured(),
      envs: ["RESEND_API_KEY", "EMAIL_FROM"],
      detail:
        "Registration confirmations, volunteer acknowledgements and campaigns. Without this, the app reports 'not configured' rather than claiming a send.",
      docs: "https://resend.com/docs",
    },
    {
      name: "WhatsApp",
      Icon: MessageCircle,
      ready: whatsappConfigured(),
      envs: ["WHATSAPP_TOKEN", "WHATSAPP_SENDER"],
      detail:
        "WhatsApp reminders and campaigns. Channels are disabled in the composer until credentials exist.",
      docs: "https://developers.facebook.com/docs/whatsapp",
    },
    {
      name: "Database",
      Icon: Database,
      ready: true,
      envs: ["DATABASE_PATH", "DATABASE_URL"],
      detail: `SQLite in this environment; PostgreSQL/Supabase in production via committed migrations. ${
        isSeeded() ? "Demo dataset loaded." : "No demo dataset detected."
      }`,
      docs: null,
    },
    {
      name: "Session signing",
      Icon: KeyRound,
      ready: checks.sessionSecret,
      envs: ["SESSION_SECRET"],
      detail:
        "Sessions are hashed and stored server-side; this secret peppers the token hashing. A development fallback is used when unset - set it before going live.",
      docs: null,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">Settings</p>
        <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
          Configuration
        </h1>
        <p className="mt-1 text-[0.8125rem] text-ink-500">
          Live status of every external dependency, read from the running environment
        </p>
      </div>

      {/* Integration status */}
      <section className="space-y-3">
        {integrations.map((i) => (
          <div key={i.name} className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
            <div className="flex items-start gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xs ${
                  i.ready ? "bg-emerald-50 text-emerald-700" : "bg-gold-500/12 text-gold-700"
                }`}
              >
                <i.Icon className="h-4 w-4" strokeWidth={2.2} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[0.8125rem] font-semibold text-ink-900">{i.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide ${
                      i.ready ? "bg-emerald-50 text-emerald-700" : "bg-gold-500/15 text-gold-700"
                    }`}
                  >
                    {i.ready ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <X className="h-2.5 w-2.5" strokeWidth={3} />}
                    {i.ready ? "Configured" : "Not configured"}
                  </span>
                </div>
                <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-500">{i.detail}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {i.envs.map((e) => (
                    <code
                      key={e}
                      className="rounded bg-paper-100 px-1.5 py-0.5 font-mono text-[0.5625rem] text-ink-600"
                    >
                      {e}
                    </code>
                  ))}
                  {i.docs && (
                    <a
                      href={i.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[0.5625rem] font-semibold text-ink-900 underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      Docs
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Demo mode */}
      {DEMO_MODE && (
        <section className="rounded-sm border border-gold-500/35 bg-gold-500/[0.07] p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" strokeWidth={2.4} />
            <div>
              <p className="text-[0.8125rem] font-semibold text-ink-900">Demonstration mode is on</p>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-600">
                The database contains a clearly-labelled demonstration dataset. Registering,
                check-in and volunteer flows all operate on real records - only the people and
                figures are simulated. Set <code className="rounded bg-white/70 px-1 font-mono">DEMO_MODE=false</code> and
                reseed before a live event.
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-[0.6875rem] font-semibold text-ink-700 hover:text-ink-900">
                  Demo sign-in accounts ({DEMO_ACCOUNTS.length})
                </summary>
                <ul className="mt-1.5 space-y-1">
                  {DEMO_ACCOUNTS.map((a) => (
                    <li key={a.email} className="font-mono text-[0.5625rem] text-ink-600">
                      {a.email} · {a.role.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </section>
      )}

      {/* Event + org */}
      <section className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
        <h2 className="text-[0.8125rem] font-semibold text-ink-900">Organisation</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { k: "Platform", v: site.name },
            { k: "Host ministry", v: site.hostFull },
            { k: "Public site", v: site.url },
            { k: "Timezone", v: "Africa/Lagos (WAT)" },
          ].map((row) => (
            <div key={row.k}>
              <dt className="text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                {row.k}
              </dt>
              <dd className="mt-0.5 text-[0.8125rem] text-ink-800">{row.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Security posture */}
      <section className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
        <h2 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
          <ShieldCheck className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
          Security posture
        </h2>
        <ul className="mt-3 space-y-1.5">
          {[
            "Passwords hashed with bcrypt (cost 12); sessions are opaque server-side tokens in httpOnly, SameSite cookies.",
            "Authorisation is checked on the server for every admin route and mutation - not just in the UI.",
            "Row-level security policies in the PostgreSQL migration mirror the same permission matrix.",
            "Public write endpoints are rate-limited per IP and honeypotted; every submission is audited.",
            "QR payloads are opaque 32-byte tokens; no attendee data is encoded or trusted from the client.",
            "Registration is not marketing consent - consent is recorded per purpose.",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" strokeWidth={3} />
              <span className="text-[0.6875rem] leading-relaxed text-ink-600">{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-900/[0.07] pt-3">
          <Link href="/admin/audit" className="btn-outline btn-sm">
            View audit log
          </Link>
          <Link href="/admin/team" className="btn-outline btn-sm">
            Manage team
          </Link>
        </div>
      </section>
    </div>
  );
}
