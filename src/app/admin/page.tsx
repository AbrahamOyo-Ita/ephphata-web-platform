import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Users,
  CheckCircle2,
  QrCode,
  HandHeart,
  HeartHandshake,
  CalendarDays,
  Plus,
  Send,
  Timer,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getFeaturedEvent, getUpcomingEvents, isRegistrationOpen } from "@/lib/data/events";
import {
  recentRegistrations,
  registrationStats,
  registrationTrend,
} from "@/lib/data/registrations";
import { attendanceStats, recentCheckins } from "@/lib/data/attendance";
import { volunteerStats } from "@/lib/data/volunteers";
import { prayerStats } from "@/lib/data/prayer";
import { audienceStats, campaignsList } from "@/lib/data/audience";
import { recentAudit } from "@/lib/audit";
import { formatRelative, formatStamp, eventDateParts, initials, percent } from "@/lib/format";
import { MetricCard } from "@/components/admin/MetricCard";
import { TrendChart } from "@/components/admin/TrendChart";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { DemoBanner } from "@/components/admin/DemoBanner";
import { Countdown } from "@/components/motion/Countdown";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requireUser("dashboard.view");
  const event = getFeaturedEvent();

  if (!event) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No active event"
        description="Create an event to start collecting registrations."
        action={{ label: "Create event", href: "/admin/events/new" }}
      />
    );
  }

  const stats = registrationStats(event.id);
  const attendance = attendanceStats(event.id);
  const volunteers = volunteerStats(event.id);
  const prayer = prayerStats();
  const audience = audienceStats();
  const trend = registrationTrend(event.id, 14);
  const recent = recentRegistrations(6);
  const checkins = recentCheckins(event.id, 5);
  const campaigns = campaignsList();
  const audit = recentAudit(6);
  const d = eventDateParts(event.starts_at);

  const trendDelta = (() => {
    const last7 = trend.slice(-7).reduce((a, t) => a + t.registrations, 0);
    const prev7 = trend.slice(0, 7).reduce((a, t) => a + t.registrations, 0);
    if (prev7 === 0) return last7 > 0 ? 100 : 0;
    return Math.round(((last7 - prev7) / prev7) * 100);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Dashboard
          </p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900 sm:text-3xl">
            {event.title}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-ink-500">
            <span>
              {d.weekday} {d.dayNum} {d.month} {d.year} · {d.time}
            </span>
            <span className="h-1 w-1 rounded-xs bg-ink-300" />
            <span>{event.venue_name}</span>
            <span className="h-1 w-1 rounded-xs bg-ink-300" />
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                isRegistrationOpen(event) ? "text-emerald-600" : "text-ink-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-xs ${
                  isRegistrationOpen(event) ? "bg-emerald-500" : "bg-ink-300"
                }`}
              />
              {isRegistrationOpen(event) ? "Registration open" : "Registration closed"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {can(user.role, "registrations.manage") && (
            <Link href="/admin/registrations/new" className="btn-ink btn-sm group">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
              Register attendee
            </Link>
          )}
          {can(user.role, "checkin.operate") && (
            <Link href="/admin/checkin" className="btn-outline btn-sm">
              <QrCode className="h-3.5 w-3.5" strokeWidth={2.2} />
              Open check-in
            </Link>
          )}
        </div>
      </div>

      <DemoBanner />

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total registrations"
          value={stats.total}
          icon={Users}
          delta={trendDelta}
          hint={`${stats.today} today`}
          href="/admin/registrations"
          accent="violet"
        />
        <MetricCard
          label="Checked in"
          value={attendance.checkedIn}
          icon={CheckCircle2}
          hint={`${attendance.rate}% of registrations`}
          progress={attendance.rate}
          href="/admin/checkin"
          accent="emerald"
        />
        <MetricCard
          label="Pending volunteers"
          value={volunteers.pending}
          icon={HandHeart}
          hint={`${volunteers.accepted} accepted · ${volunteers.total} total`}
          href="/admin/volunteers"
          accent="azure"
        />
        <MetricCard
          label="Prayer follow-ups"
          value={prayer.follow_up}
          icon={HeartHandshake}
          hint={`${prayer.received} new · ${prayer.total} total`}
          href="/admin/prayer"
          accent="magenta"
        />
      </div>

      {/* Chart + countdown */}
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[0.875rem] font-semibold text-ink-900">Registration activity</h2>
              <p className="mt-0.5 text-[0.6875rem] text-ink-400">Last 14 days · {event.edition_label ?? event.title}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3" strokeWidth={2.4} />
              {trendDelta > 0 ? "+" : ""}
              {trendDelta}% vs previous week
            </div>
          </div>
          <TrendChart data={trend} />
        </div>

        {/* Event countdown card */}
        <div className="relative overflow-hidden rounded-sm bg-ink-900 p-5 text-white">
          <div className="relative">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/40">
              Event countdown
            </p>
            <p className="mt-2 font-display text-lg uppercase tracking-wide">{event.title}</p>

            <div className="mt-5">
              <Countdown target={event.starts_at} />
            </div>

            <div className="mt-5 space-y-2 border-t border-white/15 pt-4">
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="text-white/50">Registrations</span>
                <span className="font-semibold tabular-nums">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="text-white/50">Checked in</span>
                <span className="font-semibold tabular-nums">{attendance.checkedIn}</span>
              </div>
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="text-white/50">Volunteers accepted</span>
                <span className="font-semibold tabular-nums">{volunteers.accepted}</span>
              </div>
            </div>

            {can(user.role, "programme.manage") && (
              <Link
                href="/admin/programme"
                className="mt-5 flex items-center justify-between rounded-xs border border-white/20 bg-white/[0.07] px-3 py-2.5 text-[0.75rem] font-semibold transition-colors hover:bg-white/[0.14]"
              >
                <span className="flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5" strokeWidth={2} />
                  Open programme timer
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent registrations + activity */}
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        {/* Recent registrations */}
        <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
          <div className="flex items-center justify-between border-b border-ink-900/[0.07] px-5 py-3.5">
            <h2 className="text-[0.875rem] font-semibold text-ink-900">Latest registrations</h2>
            <Link
              href="/admin/registrations"
              className="group inline-flex items-center gap-1 text-[0.75rem] font-semibold text-ink-900 underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              View all
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[0.8125rem] text-ink-400">No registrations yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-900/[0.06]">
              {recent.map((reg) => (
                <li key={reg.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-50">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xs bg-paper-100 text-[0.625rem] font-bold text-ink-600">
                    {initials(`${reg.first_name} ${reg.last_name}`)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-ink-900">
                      {reg.first_name} {reg.last_name}
                    </p>
                    <p className="truncate text-[0.6875rem] text-ink-400">{reg.email}</p>
                  </div>
                  <div className="hidden shrink-0 sm:block">
                    <StatusBadge
                      tone={reg.checked_in_at ? "emerald" : reg.status === "waitlisted" ? "amber" : "neutral"}
                      label={reg.checked_in_at ? "Checked in" : reg.status === "waitlisted" ? "Waitlist" : "Confirmed"}
                    />
                  </div>
                  <span className="shrink-0 text-[0.625rem] tabular-nums text-ink-400">
                    {formatRelative(reg.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Activity feed */}
        <div className="rounded-sm border border-ink-900/[0.08] bg-white">
          <div className="border-b border-ink-900/[0.07] px-5 py-3.5">
            <h2 className="text-[0.875rem] font-semibold text-ink-900">Recent activity</h2>
          </div>
          <ul className="divide-y divide-ink-900/[0.06]">
            {audit.slice(0, 6).map((entry) => (
              <li key={entry.id} className="flex items-start gap-2.5 px-5 py-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-xs bg-ink-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.75rem] leading-snug text-ink-800">
                    <span className="font-semibold">{formatAction(entry.action)}</span>
                  </p>
                  <p className="mt-0.5 truncate text-[0.625rem] text-ink-400">
                    {entry.actor_email ?? "system"} · {formatRelative(entry.created_at)}
                  </p>
                </div>
              </li>
            ))}
            {audit.length === 0 && (
              <li className="px-5 py-8 text-center text-[0.75rem] text-ink-400">No activity recorded.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom row: campaigns, check-ins, quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.875rem] font-semibold text-ink-900">Campaigns</h2>
            {can(user.role, "communications.view") && (
              <Link href="/admin/communications" className="text-[0.6875rem] font-semibold text-ink-900 underline decoration-1 underline-offset-4 hover:decoration-2">
                Manage
              </Link>
            )}
          </div>
          <ul className="mt-3 space-y-2.5">
            {campaigns.slice(0, 3).map((c) => (
              <li key={c.id} className="rounded-xs border border-ink-900/[0.07] p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.75rem] font-medium leading-snug text-ink-800">{c.name}</p>
                  <StatusBadge
                    tone={c.status === "sent" ? "emerald" : c.status === "scheduled" ? "azure" : "neutral"}
                    label={c.status}
                  />
                </div>
                {c.status === "sent" && (
                  <p className="mt-1.5 text-[0.625rem] text-ink-400">
                    {c.delivered_count}/{c.recipient_count} delivered
                    {c.failed_count > 0 && (
                      <span className="ml-1 font-semibold text-flame-600">· {c.failed_count} failed</span>
                    )}
                  </p>
                )}
              </li>
            ))}
            {campaigns.length === 0 && (
              <li className="py-4 text-center text-[0.75rem] text-ink-400">No campaigns yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.875rem] font-semibold text-ink-900">Recent check-ins</h2>
            <Link href="/admin/checkin" className="text-[0.6875rem] font-semibold text-ink-900 underline decoration-1 underline-offset-4 hover:decoration-2">
              Desk
            </Link>
          </div>
          <ul className="mt-3 space-y-2.5">
            {checkins.map((c, i) => (
              <li key={`${c.reference}-${i}`} className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xs bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.75rem] font-medium text-ink-800">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-[0.625rem] text-ink-400">
                    {formatStamp(c.checked_in_at)} · {c.method}
                  </p>
                </div>
              </li>
            ))}
            {checkins.length === 0 && (
              <li className="py-4 text-center text-[0.75rem] text-ink-400">
                No check-ins yet.
              </li>
            )}
          </ul>
        </div>

        {/* Quick actions */}
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
          <h2 className="text-[0.875rem] font-semibold text-ink-900">Quick actions</h2>
          <div className="mt-3 space-y-1.5">
            {[
              { label: "Create event", href: "/admin/events/new", icon: Plus, perm: "events.manage" },
              { label: "View registrations", href: "/admin/registrations", icon: Users, perm: "registrations.view" },
              { label: "Register attendee", href: "/admin/registrations/new", icon: Plus, perm: "registrations.manage" },
              { label: "Open check-in", href: "/admin/checkin", icon: QrCode, perm: "checkin.operate" },
              { label: "Review volunteers", href: "/admin/volunteers", icon: HandHeart, perm: "volunteers.view" },
              { label: "Send announcement", href: "/admin/communications", icon: Send, perm: "communications.view" },
              { label: "Programme timer", href: "/admin/programme", icon: Timer, perm: "programme.view" },
            ]
              .filter((a) => can(user.role, a.perm as never))
              .map((action) => (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className="group flex items-center gap-2.5 rounded-xs px-2.5 py-2 text-[0.75rem] font-medium text-ink-700 transition-colors hover:bg-paper-100 hover:text-ink-900"
                >
                  <action.icon className="h-3.5 w-3.5 text-ink-400 group-hover:text-ink-700" strokeWidth={2.2} />
                  {action.label}
                  <ArrowRight className="ml-auto h-3 w-3 -translate-x-1 text-ink-300 opacity-0 transition-colors group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              ))}
          </div>

          {audience.total > 0 && (
            <p className="mt-4 border-t border-ink-900/[0.07] pt-3 text-[0.625rem] leading-relaxed text-ink-400">
              Audience directory: {audience.total} contacts · {percent(audience.subscribed, audience.total)}% subscribed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    "auth.login": "Signed in",
    "auth.logout": "Signed out",
    "registration.create": "New registration created",
    "registration.update": "Registration updated",
    "registration.export": "Registration list exported",
    "registration.cancel": "Registration cancelled",
    "checkin.create": "Attendee checked in",
    "event.create": "Event created",
    "event.update": "Event updated",
    "volunteer.create": "Volunteer application received",
    "volunteer.review": "Volunteer application reviewed",
    "prayer.create": "Prayer request received",
    "prayer.update": "Prayer request updated",
    "campaign.create": "Campaign composed",
    "campaign.send": "Campaign dispatched",
    "content.announcement": "Announcement published",
    "team.invite": "Team member invited",
    "team.role_change": "Team role changed",
    "team.status_change": "Team status changed",
    "volunteer.export": "Volunteer list exported",
    "contact.create": "Contact enquiry received",
    "system.seed": "Demonstration data loaded",
  };
  return map[action] ?? action.replace(/\./g, " ");
}
