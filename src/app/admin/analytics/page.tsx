import { TrendingUp, Users, CheckCircle2, Percent, BarChart3 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listEvents, getFeaturedEvent } from "@/lib/data/events";
import { registrationStats, registrationTrend } from "@/lib/data/registrations";
import { attendanceStats, arrivalCurve } from "@/lib/data/attendance";
import { volunteerStats } from "@/lib/data/volunteers";
import { audienceStats } from "@/lib/data/audience";
import { EmptyState } from "@/components/admin/EmptyState";
import { DemoBanner } from "@/components/admin/DemoBanner";
import { TrendChart, ComparisonChart } from "@/components/admin/TrendChart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireUser("analytics.view");
  const event = getFeaturedEvent();
  const events = listEvents({ includeAll: false });

  if (!event) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No data to analyse"
        description="Analytics appear once an event has been published."
        action={{ label: "Manage events", href: "/admin/events" }}
      />
    );
  }

  const reg = registrationStats(event.id);
  const att = attendanceStats(event.id);
  const vol = volunteerStats(event.id);
  const audience = audienceStats();
  const trend = registrationTrend(event.id, 30);
  const arrivals = arrivalCurve(event.id);

  const comparison = events.slice(0, 6).map((e) => {
    const s = registrationStats(e.id);
    const a = attendanceStats(e.id);
    return {
      name: e.edition_label || e.title.slice(0, 14),
      registered: s.total,
      attended: a.checkedIn,
    };
  });

  const conversion = reg.total > 0 ? Math.round((att.checkedIn / reg.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">Analytics</p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">{event.title}</h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">Figures are computed from live records</p>
        </div>
        <DemoBanner compact />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Registered", value: reg.total, sub: `${reg.today} today`, Icon: Users, tone: "text-violet-600" },
          { label: "Checked in", value: att.checkedIn, sub: `${att.rate}% of registered`, Icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Show-up rate", value: conversion, suffix: "%", sub: "arrivals ÷ registrations", Icon: Percent, tone: "text-azure-600" },
          { label: "Reachable audience", value: audience.reachable, sub: `${audience.subscribed} marketing consents`, Icon: TrendingUp, tone: "text-magenta-600" },
        ].map((m) => (
          <div key={m.label} className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
            <m.Icon className={`h-4 w-4 ${m.tone}`} strokeWidth={2.2} />
            <p className="mt-2 text-2xl font-semibold tabular-nums leading-none text-ink-900">
              {m.value}
              {m.suffix}
            </p>
            <p className="mt-1 text-[0.625rem] font-medium uppercase tracking-wide text-ink-400">{m.label}</p>
            <p className="mt-0.5 text-[0.5625rem] text-ink-400">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <h2 className="text-[0.8125rem] font-semibold text-ink-900">Registration trend</h2>
          <p className="text-[0.625rem] text-ink-400">Last 30 days</p>
          <TrendChart data={trend} />
        </div>

        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <h2 className="text-[0.8125rem] font-semibold text-ink-900">Arrivals by hour</h2>
          <p className="text-[0.625rem] text-ink-400">When attendees actually arrive at the venue</p>
          {arrivals.length === 0 ? (
            <p className="py-12 text-center text-[0.75rem] text-ink-400">No check-ins recorded yet.</p>
          ) : (
            <ComparisonChart
              data={arrivals.map((a) => ({ name: `${a.hour}:00`, count: a.n }))}
              keys={["count"]}
              labels={{ count: "Arrivals" }}
              height={220}
              ariaLabel="Arrivals by hour of day"
            />
          )}
        </div>
      </div>

      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
        <h2 className="text-[0.8125rem] font-semibold text-ink-900">Edition comparison</h2>
        <p className="text-[0.625rem] text-ink-400">Registered vs attended, per edition</p>
        {comparison.length === 0 ? (
          <p className="py-12 text-center text-[0.75rem] text-ink-400">Not enough editions yet.</p>
        ) : (
          <ComparisonChart
            data={comparison}
            keys={["registered", "attended"]}
            labels={{ registered: "Registered", attended: "Attended" }}
            height={240}
            ariaLabel="Registered versus attended, per edition"
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-400">Volunteers accepted</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{vol.accepted}</p>
          <p className="text-[0.625rem] text-ink-400">of {vol.total} applications</p>
        </div>
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-400">Capacity used</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">
            {event.capacity ? `${Math.round((reg.total / event.capacity) * 100)}%` : "-"}
          </p>
          <p className="text-[0.625rem] text-ink-400">
            {event.capacity ? `${reg.total} of ${event.capacity} places` : "No capacity set"}
          </p>
        </div>
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-400">Waitlisted</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{reg.waitlisted}</p>
          <p className="text-[0.625rem] text-ink-400">{reg.cancelled} cancelled</p>
        </div>
      </div>
    </div>
  );
}
