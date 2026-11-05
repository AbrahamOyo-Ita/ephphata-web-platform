import Link from "next/link";
import { HandHeart, Users, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getFeaturedEvent } from "@/lib/data/events";
import { departmentLoad, listVolunteers, volunteerStats } from "@/lib/data/volunteers";
import { formatRelative, initials } from "@/lib/format";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { DemoBanner } from "@/components/admin/DemoBanner";
import { VolunteerFilters } from "@/components/admin/VolunteerFilters";

export const dynamic = "force-dynamic";
export const metadata = { title: "Volunteers" };

export default async function VolunteersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("volunteers.view");
  const params = await searchParams;
  const event = getFeaturedEvent();

  if (!event) {
    return (
      <EmptyState
        icon={HandHeart}
        title="No active event"
        description="Volunteer applications are scoped to an event."
        action={{ label: "Manage events", href: "/admin/events" }}
      />
    );
  }

  const status = (params.status ?? "") as never;
  const volunteers = listVolunteers({
    eventId: event.id,
    status,
    departmentId: params.department,
    search: params.q,
  });
  const stats = volunteerStats(event.id);
  const departments = departmentLoad(event.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Volunteers
          </p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
            {event.title}
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            {stats.total} applications · {stats.pending} awaiting review
          </p>
        </div>
        <DemoBanner compact />
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { key: "submitted", label: "Submitted", value: stats.submitted, Icon: Clock, tone: "text-azure-600" },
          { key: "under_review", label: "In review", value: stats.under_review, Icon: Users, tone: "text-violet-600" },
          { key: "accepted", label: "Accepted", value: stats.accepted, Icon: CheckCircle2, tone: "text-emerald-600" },
          { key: "waitlisted", label: "Waitlisted", value: stats.waitlisted, Icon: Clock, tone: "text-gold-700" },
          { key: "declined", label: "Declined", value: stats.declined, Icon: Users, tone: "text-ink-400" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/admin/volunteers${s.key === status ? "" : `?status=${s.key}`}`}
            className={`rounded-xs border bg-white px-3.5 py-3 transition-colors ${
              status === s.key ? "border-ink-900/25 ring-1 ring-ink-900/10" : "border-ink-900/[0.08]"
            }`}
          >
            <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wide text-ink-400">
              <s.Icon className={`h-3 w-3 ${s.tone}`} strokeWidth={2.4} />
              {s.label}
            </p>
            <p className={`mt-1 text-xl font-semibold tabular-nums leading-none ${s.tone}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        {/* Applications */}
        <div className="min-w-0 space-y-3">
          <VolunteerFilters departments={departments.map((d) => ({ id: d.id, name: d.name }))} current={params} />

          <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
            <div className="border-b border-ink-900/[0.07] px-4 py-3">
              <h2 className="text-[0.8125rem] font-semibold text-ink-900">
                Applications
                <span className="ml-1.5 font-normal text-ink-400">({volunteers.length})</span>
              </h2>
            </div>

            {volunteers.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-[0.8125rem] text-ink-400">No applications match these filters.</p>
                <Link href="/admin/volunteers" className="btn-outline btn-sm mt-4">
                  Clear filters
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-ink-900/[0.05]">
                {volunteers.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/admin/volunteers/${v.id}`}
                      className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-paper-50"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xs bg-paper-100 text-[0.5625rem] font-bold text-ink-600">
                        {initials(v.full_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[0.8125rem] font-medium text-ink-900 group-hover:text-violet-700">
                            {v.full_name}
                          </p>
                          <StatusBadge
                            tone={STATUS_TONES[v.status] ?? "neutral"}
                            label={STATUS_LABELS[v.status] ?? v.status}
                          />
                        </div>
                        <p className="mt-0.5 truncate text-[0.6875rem] text-ink-400">
                          {v.department_name ?? "No department"}
                          {v.experience && ` · ${v.experience.slice(0, 60)}${v.experience.length > 60 ? "…" : ""}`}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[0.625rem] text-ink-400">
                          <span className="font-mono">{v.reference}</span>
                          <span className="h-1 w-1 rounded-xs bg-ink-300" />
                          <span>{formatRelative(v.created_at)}</span>
                        </div>
                      </div>
                      <ArrowRight className="mt-2 h-3.5 w-3.5 shrink-0 text-ink-300 opacity-0 transition-colors group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Department capacity */}
        <div className="min-w-0 rounded-sm border border-ink-900/[0.08] bg-white">
          <div className="border-b border-ink-900/[0.07] px-4 py-3">
            <h2 className="text-[0.8125rem] font-semibold text-ink-900">Department capacity</h2>
            <p className="text-[0.625rem] text-ink-400">Accepted volunteers against places</p>
          </div>
          <ul className="divide-y divide-ink-900/[0.05]">
            {departments.map((d) => {
              const pct = d.capacity ? Math.round((d.accepted / d.capacity) * 100) : 0;
              return (
                <li key={d.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[0.75rem] font-medium text-ink-800">{d.name}</p>
                    <span className="shrink-0 text-[0.625rem] tabular-nums text-ink-400">
                      {d.accepted}/{d.capacity ?? "∞"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-xs bg-ink-900/[0.07]">
                    <div
                      className={`h-full rounded-xs transition-colors ${
                        pct >= 100 ? "bg-flame-500" : pct >= 70 ? "bg-gold-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {can(user.role, "volunteers.manage") && (
            <div className="border-t border-ink-900/[0.07] p-3">
              <a
                href="/admin/volunteers/export"
                className="flex w-full items-center justify-center gap-1.5 rounded-xs border border-ink-900/10 px-3 py-2 text-[0.75rem] font-semibold text-ink-700 transition-colors hover:bg-paper-50"
              >
                Export accepted assignments
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
