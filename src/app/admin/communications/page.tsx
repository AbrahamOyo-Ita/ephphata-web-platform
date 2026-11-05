import Link from "next/link";
import { Send, Mail, MessageCircle, FlaskConical, AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { campaignsList } from "@/lib/data/audience";
import { formatRelative } from "@/lib/format";
import { emailConfigured, whatsappConfigured } from "@/lib/notifications";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { DemoBanner } from "@/components/admin/DemoBanner";
import { CampaignComposer } from "@/components/admin/CampaignComposer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communications" };

export default async function CommunicationsPage() {
  const user = await requireUser("communications.view");
  const campaigns = campaignsList();
  const emailReady = emailConfigured();
  const whatsappReady = whatsappConfigured();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Communications
          </p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
            Campaigns
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            Announcements to registrants and consented subscribers
          </p>
        </div>
        <DemoBanner compact />
      </div>

      {/* Provider status - never claim delivery capability we do not have */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className={`flex items-start gap-3 rounded-sm border p-4 ${
            emailReady ? "border-emerald-300/60 bg-emerald-50" : "border-gold-500/35 bg-gold-500/[0.07]"
          }`}
        >
          <Mail className={`mt-0.5 h-4 w-4 shrink-0 ${emailReady ? "text-emerald-700" : "text-gold-700"}`} strokeWidth={2.2} />
          <div>
            <p className="text-[0.75rem] font-semibold text-ink-900">
              Email · {emailReady ? "connected" : "not configured"}
            </p>
            <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-500">
              {emailReady
                ? "Outbound email is live through the configured provider."
                : "Set RESEND_API_KEY (or SMTP_*) in the environment. Until then, confirmation emails are logged as not sent - never faked."}
            </p>
          </div>
        </div>
        <div
          className={`flex items-start gap-3 rounded-sm border p-4 ${
            whatsappReady ? "border-emerald-300/60 bg-emerald-50" : "border-gold-500/35 bg-gold-500/[0.07]"
          }`}
        >
          <MessageCircle className={`mt-0.5 h-4 w-4 shrink-0 ${whatsappReady ? "text-emerald-700" : "text-gold-700"}`} strokeWidth={2.2} />
          <div>
            <p className="text-[0.75rem] font-semibold text-ink-900">
              WhatsApp · {whatsappReady ? "connected" : "not configured"}
            </p>
            <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-500">
              {whatsappReady
                ? "WhatsApp messaging is live through the configured provider."
                : "Set WHATSAPP_TOKEN and WHATSAPP_SENDER. WhatsApp campaigns stay disabled until then."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <CampaignComposer
          emailReady={emailReady}
          whatsappReady={whatsappReady}
          canManage={can(user.role, "communications.manage")}
        />

        <div className="space-y-3">
          <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
            <div className="border-b border-ink-900/[0.07] px-4 py-3">
              <h2 className="text-[0.8125rem] font-semibold text-ink-900">Campaign history</h2>
              <p className="text-[0.625rem] text-ink-400">{campaigns.length} campaigns</p>
            </div>

            {campaigns.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Send className="mx-auto h-5 w-5 text-ink-300" strokeWidth={1.8} />
                <p className="mt-2 text-[0.75rem] text-ink-400">No campaigns have been sent yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-900/[0.05]">
                {campaigns.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[0.8125rem] font-medium text-ink-900">{c.name}</p>
                        {c.subject && <p className="truncate text-[0.6875rem] text-ink-500">{c.subject}</p>}
                        <p className="mt-0.5 text-[0.625rem] text-ink-400">
                          {c.channel} · {c.audience.replace("_", " ")} · {formatRelative(c.created_at)}
                        </p>
                      </div>
                      <StatusBadge
                        tone={STATUS_TONES[c.status] ?? "neutral"}
                        label={STATUS_LABELS[c.status] ?? c.status}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[0.625rem] tabular-nums text-ink-400">
                      <span>{c.recipient_count} recipients</span>
                      <span className="text-emerald-700">{c.delivered_count} delivered</span>
                      {c.failed_count > 0 && <span className="text-flame-600">{c.failed_count} failed</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-start gap-2.5 rounded-sm border border-ink-900/[0.08] bg-white p-4">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2.2} />
            <p className="text-[0.6875rem] leading-relaxed text-ink-500">
              Delivery counts reflect provider webhooks. A campaign marked <em>sent</em> means the
              provider accepted it - not that every recipient read it. Only contacts with marketing
              consent are eligible for newsletter campaigns; event updates may go to that
              event&apos;s registrants.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-ink-900/[0.07] pt-4">
        <Link href="/admin/audience" className="btn-outline btn-sm">
          View audience
        </Link>
        <Link href="/admin/analytics" className="btn-outline btn-sm">
          Analytics
        </Link>
      </div>
    </div>
  );
}
