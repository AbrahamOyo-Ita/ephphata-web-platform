import { ScrollText, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listAudit } from "@/lib/audit";
import { formatStamp, formatRelative } from "@/lib/format";
import { EmptyState } from "@/components/admin/EmptyState";
import { AuditFilters } from "@/components/admin/AuditFilters";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DemoBanner } from "@/components/admin/DemoBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

const ACTION_TONE: Record<string, "emerald" | "violet" | "azure" | "flame" | "amber" | "neutral"> = {
  "auth.login": "azure",
  "auth.logout": "neutral",
  "auth.failed": "flame",
  "registration.create": "emerald",
  "registration.cancel": "flame",
  "registration.export": "violet",
  "checkin.create": "emerald",
  "volunteer.create": "emerald",
  "volunteer.review": "violet",
  "volunteer.export": "violet",
  "prayer.create": "azure",
  "prayer.update": "violet",
  "campaign.create": "amber",
  "campaign.send": "amber",
  "content.announcement": "amber",
  "contact.create": "neutral",
  "event.create": "emerald",
  "event.update": "violet",
  "team.invite": "amber",
  "team.role_change": "amber",
  "team.status_change": "flame",
  "system.seed": "neutral",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser("audit.view");
  const params = await searchParams;
  const rows = listAudit({ search: params.q, action: params.action, limit: 200 });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">Audit</p>
        <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
          Activity log
        </h1>
        <p className="mt-1 text-[0.8125rem] text-ink-500">
          Every privileged action, who performed it, and when
        </p>
        </div>
        <DemoBanner compact />
      </div>

      <div className="flex items-start gap-2.5 rounded-sm border border-ink-900/[0.08] bg-white px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={2.2} />
        <p className="text-[0.6875rem] leading-relaxed text-ink-500">
          Entries are append-only. Sensitive content is deliberately never recorded - prayer request
          text, passwords and QR tokens are excluded, and IP addresses are stored as hashes only.
        </p>
      </div>

      <AuditFilters actions={Object.keys(ACTION_TONE)} current={params} />

      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No activity recorded"
          description="Administrative actions appear here as soon as they happen."
        />
      ) : (
        <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
          <ul className="divide-y divide-ink-900/[0.05]">
            {rows.map((r) => {
              let detail: Record<string, unknown> | null = null;
              try {
                detail = r.detail ? (JSON.parse(r.detail) as Record<string, unknown>) : null;
              } catch {
                detail = null;
              }

              return (
                <li key={r.id} className="flex items-start gap-3 px-4 py-2.5">
                  <StatusBadge
                    tone={ACTION_TONE[r.action] ?? "neutral"}
                    label={r.action.replace(/\./g, " · ")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.75rem] text-ink-800">
                      <span className="font-medium">{r.actor_email ?? "system"}</span>
                      {r.entity_type && (
                        <span className="text-ink-400">
                          {" "}
                          on {r.entity_type}
                          {r.entity_id ? `/${r.entity_id.slice(0, 8)}` : ""}
                        </span>
                      )}
                    </p>
                    {detail && Object.keys(detail).length > 0 && (
                      <p className="mt-0.5 break-all font-mono text-[0.5625rem] leading-relaxed text-ink-400">
                        {JSON.stringify(detail)}
                      </p>
                    )}
                  </div>
                  <time
                    dateTime={r.created_at}
                    title={formatStamp(r.created_at)}
                    className="shrink-0 whitespace-nowrap text-[0.5625rem] tabular-nums text-ink-400"
                  >
                    {formatRelative(r.created_at)}
                  </time>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
