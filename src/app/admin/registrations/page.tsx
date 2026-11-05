import Link from "next/link";
import { Users, Plus, Filter, Download, CheckCircle2, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getFeaturedEvent, getEventById, listEvents } from "@/lib/data/events";
import { listRegistrations, registrationStats } from "@/lib/data/registrations";
import { formatRelative, initials } from "@/lib/format";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { RegistrationFilters } from "@/components/admin/RegistrationFilters";
import { Pagination } from "@/components/admin/Pagination";
import { DemoBanner } from "@/components/admin/DemoBanner";
import { ATTENDANCE_LABELS, HEARD_VIA_LABELS } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = { title: "Registrations" };

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("registrations.view");
  const params = await searchParams;

  const events = listEvents({ includeAll: true });
  const featured = getFeaturedEvent();
  const eventId = params.event ?? featured?.id;
  const event = eventId ? getEventById(eventId) : null;

  const result = listRegistrations({
    eventId,
    search: params.q,
    status: params.status,
    source: params.source,
    attendance: (params.attendance as "checked_in" | "not_checked_in" | undefined) ?? undefined,
    page: Number(params.page ?? 1),
    pageSize: 25,
    sort: (params.sort as "newest" | "oldest" | "name") ?? "newest",
  });

  const stats = registrationStats(eventId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Registrations
          </p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
            {event?.title ?? "All events"}
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            {result.total} {result.total === 1 ? "record" : "records"}
            {params.q && ` matching “${params.q}”`}
            {stats.today > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-xs bg-emerald-500" />
                {stats.today} today
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={`/admin/registrations/export?${new URLSearchParams(params as Record<string, string>).toString()}`} className="btn-outline btn-sm">
            <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
            Export CSV
          </a>
          {can(user.role, "registrations.manage") && (
            <Link href={`/admin/registrations/new${eventId ? `?event=${eventId}` : ""}`} className="btn-ink btn-sm group">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
              Register attendee
            </Link>
          )}
        </div>
      </div>

      <DemoBanner compact />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Confirmed", value: stats.total, icon: Users, tone: "text-ink-900" },
          { label: "Checked in", value: stats.checkedIn, icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Waitlisted", value: stats.waitlisted, icon: Clock, tone: "text-gold-700" },
          { label: "Cancelled", value: stats.cancelled, icon: Users, tone: "text-flame-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xs border border-ink-900/[0.08] bg-white px-3.5 py-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-ink-400">{s.label}</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums leading-none ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <RegistrationFilters
        events={events.map((e) => ({ id: e.id, title: e.title }))}
        current={{ event: eventId, q: params.q, status: params.status, source: params.source, attendance: params.attendance, sort: params.sort }}
      />

      {result.rows.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No registrations match"
          description={
            params.q || params.status || params.source || params.attendance
              ? "Try clearing the filters, or search by a different name, email or reference."
              : "Registrations will appear here as soon as they arrive."
          }
          action={{ label: "Clear filters", href: `/admin/registrations${eventId ? `?event=${eventId}` : ""}` }}
        />
      ) : (
        <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink-900/[0.07] bg-paper-50">
                  {["Attendee", "Reference", "Contact", "Source", "Intent", "Status", "Registered"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-ink-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/[0.05]">
                {result.rows.map((reg) => {
                  const status = reg.checked_in_at ? "checked_in" : reg.status;
                  return (
                    <tr key={reg.id} className="group transition-colors hover:bg-paper-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/registrations/${reg.id}`} className="flex items-center gap-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xs bg-paper-100 text-[0.5625rem] font-bold text-ink-600">
                            {initials(`${reg.first_name} ${reg.last_name}`)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[0.8125rem] font-medium text-ink-900 group-hover:text-violet-700">
                              {reg.first_name} {reg.last_name}
                            </span>
                            {reg.city && (
                              <span className="block text-[0.625rem] text-ink-400">{reg.city}</span>
                            )}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[0.6875rem] text-ink-600">{reg.reference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block max-w-[190px] truncate text-[0.75rem] text-ink-700">{reg.email}</span>
                        <span className="block text-[0.625rem] tabular-nums text-ink-400">{reg.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[0.6875rem] capitalize text-ink-500">{reg.source}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[0.6875rem] text-ink-500">
                          {ATTENDANCE_LABELS[reg.attendance_intent] ?? reg.attendance_intent}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          tone={status === "checked_in" ? "emerald" : STATUS_TONES[reg.status] ?? "neutral"}
                          label={status === "checked_in" ? "Checked in" : STATUS_LABELS[reg.status] ?? reg.status}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[0.625rem] tabular-nums text-ink-400">
                        {formatRelative(reg.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-ink-900/[0.06] lg:hidden">
            {result.rows.map((reg) => {
              const status = reg.checked_in_at ? "checked_in" : reg.status;
              return (
                <li key={reg.id}>
                  <Link href={`/admin/registrations/${reg.id}`} className="flex items-start gap-3 px-4 py-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xs bg-paper-100 text-[0.625rem] font-bold text-ink-600">
                      {initials(`${reg.first_name} ${reg.last_name}`)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[0.875rem] font-medium text-ink-900">
                          {reg.first_name} {reg.last_name}
                        </p>
                        <StatusBadge
                          tone={status === "checked_in" ? "emerald" : STATUS_TONES[reg.status] ?? "neutral"}
                          label={status === "checked_in" ? "In" : STATUS_LABELS[reg.status] ?? reg.status}
                        />
                      </div>
                      <p className="mt-0.5 truncate text-[0.6875rem] text-ink-400">{reg.email}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[0.625rem] text-ink-400">
                        <span className="font-mono">{reg.reference}</span>
                        <span className="h-1 w-1 rounded-xs bg-ink-300" />
                        <span>{formatRelative(reg.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Pagination
            page={result.page}
            pages={result.pages}
            total={result.total}
            pageSize={result.pageSize}
            baseHref="/admin/registrations"
            params={params}
          />
        </div>
      )}
    </div>
  );
}
