import { Users, Mail, UserCheck, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audienceStats, listAudience } from "@/lib/data/audience";
import { formatRelative } from "@/lib/format";
import { EmptyState } from "@/components/admin/EmptyState";
import { DemoBanner } from "@/components/admin/DemoBanner";
import { AudienceTable } from "@/components/admin/AudienceTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audience" };

export default async function AudiencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("audience.view");
  const params = await searchParams;
  const people = listAudience({
    search: params.q,
    subscribedOnly: params.subscribed === "1",
  });
  const stats = audienceStats();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">Audience</p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">People</h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            Everyone who has registered or subscribed, with consent status
          </p>
        </div>
        <DemoBanner compact />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total contacts", value: stats.total, Icon: Users, tone: "text-violet-600" },
          { label: "Marketing consent", value: stats.subscribed, Icon: Mail, tone: "text-emerald-600" },
          { label: "Reachable registrants", value: stats.reachable, Icon: UserCheck, tone: "text-azure-600" },
          {
            label: "Attended at least once",
            value: people.filter((p) => p.events_attended > 0).length,
            Icon: TrendingUp,
            tone: "text-magenta-600",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
            <s.Icon className={`h-4 w-4 ${s.tone}`} strokeWidth={2.2} />
            <p className="mt-2 text-2xl font-semibold tabular-nums leading-none text-ink-900">{s.value}</p>
            <p className="mt-1 text-[0.625rem] font-medium uppercase tracking-wide text-ink-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-sm border border-gold-500/30 bg-gold-500/[0.06] px-4 py-3">
        <p className="text-[0.6875rem] leading-relaxed text-ink-600">
          <strong className="font-semibold">Consent is per-purpose.</strong> Registering for an event
          is not marketing consent. Only contacts marked <em>Subscribed</em> may receive campaigns;
          event-specific messages go to that event&apos;s registrants.
        </p>
      </div>

      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Contacts appear here as people register or subscribe to updates."
        />
      ) : (
        <AudienceTable people={people.map((p) => ({ ...p, lastLabel: formatRelative(p.last_seen_at) }))} />
      )}
    </div>
  );
}
