import Link from "next/link";
import { HeartHandshake, Lock, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listPrayerRequests, prayerStats } from "@/lib/data/prayer";
import { formatRelative } from "@/lib/format";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { PrayerList } from "@/components/admin/PrayerList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prayer requests" };

export default async function PrayerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("prayer.view");
  const params = await searchParams;
  const status = (params.status ?? "") as never;
  const requests = listPrayerRequests({ status, search: params.q });
  const stats = prayerStats();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
          Prayer
        </p>
        <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
          Prayer requests
        </h1>
        <p className="mt-1 text-[0.8125rem] text-ink-500">
          {stats.total} requests · {stats.received} new · {stats.follow_up} needing follow-up
        </p>
      </div>

      {/* Confidentiality notice - this is the most sensitive screen in the app */}
      <div className="flex items-start gap-3 rounded-sm border border-violet-600/25 bg-violet-50 px-4 py-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={2.2} />
        <div className="text-[0.75rem] leading-relaxed text-ink-700">
          <p className="font-semibold">Confidential - prayer team only</p>
          <p className="mt-0.5 text-ink-500">
            These requests are restricted to the prayer team at the database level. Do not copy,
            forward or discuss their contents outside the team. Access is limited to what each
            request needs, and every status change is audited.
          </p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { key: "received", label: "Received", value: stats.received, tone: "text-azure-600" },
          { key: "in_prayer", label: "In prayer", value: stats.in_prayer, tone: "text-violet-600" },
          { key: "follow_up", label: "Follow-up", value: stats.follow_up, tone: "text-gold-700" },
          { key: "answered", label: "Answered", value: stats.answered, tone: "text-emerald-600" },
          { key: "archived", label: "Archived", value: stats.archived, tone: "text-ink-400" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/admin/prayer${status === s.key ? "" : `?status=${s.key}`}`}
            className={`rounded-xs border bg-white px-3.5 py-3 transition-colors ${
              status === s.key ? "border-ink-900/25 ring-1 ring-ink-900/10" : "border-ink-900/[0.08]"
            }`}
          >
            <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-ink-400">{s.label}</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums leading-none ${s.tone}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No requests here"
          description={
            status
              ? "No prayer requests currently have this status."
              : "Prayer requests submitted through the public form will appear here."
          }
          action={{ label: "View all", href: "/admin/prayer" }}
        />
      ) : (
        <PrayerList
          requests={requests.map((r) => ({
            id: r.id,
            reference: r.reference,
            displayName: r.is_anonymous ? "Anonymous" : r.display_name ?? "Unnamed",
            isAnonymous: Boolean(r.is_anonymous),
            request: r.request,
            category: r.category,
            status: r.status,
            allowFollowUp: Boolean(r.allow_follow_up),
            email: r.email,
            phone: r.phone,
            createdAt: r.created_at,
            createdLabel: formatRelative(r.created_at),
            internalNotes: r.internal_notes,
          }))}
          canManage={can(user.role, "prayer.manage")}
        />
      )}
    </div>
  );
}
