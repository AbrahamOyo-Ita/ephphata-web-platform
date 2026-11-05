import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, CalendarDays, MapPin, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getEventById, getDepartments } from "@/lib/data/events";
import { registrationStats } from "@/lib/data/registrations";
import { attendanceStats } from "@/lib/data/attendance";
import { volunteerStats } from "@/lib/data/volunteers";
import { getSchedule } from "@/lib/data/programme";
import { formatStamp } from "@/lib/format";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { EventForm } from "@/components/admin/EventForm";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("events.view");
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const reg = registrationStats(event.id);
  const att = attendanceStats(event.id);
  const vol = volunteerStats(event.id);
  const schedule = getSchedule(event.id);
  const departments = getDepartments(event.id);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All events
        </Link>
        <Link
          href={`/events/${event.slug}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-900 underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          View public page
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={STATUS_TONES[event.status] ?? "neutral"} label={STATUS_LABELS[event.status] ?? event.status.replace("_", " ")} />
          <span className="font-mono text-[0.625rem] text-ink-400">/{event.slug}</span>
        </div>
        <h1 className="mt-2 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">{event.title}</h1>
        {event.theme && <p className="mt-1 text-[0.8125rem] italic text-ink-500">{event.theme}</p>}
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Registered", value: reg.total },
          { label: "Checked in", value: att.checkedIn },
          { label: "Volunteers", value: vol.accepted },
          { label: "Segments", value: schedule.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xs border border-ink-900/[0.08] bg-white px-3.5 py-3">
            <p className="text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-400">{s.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums leading-none text-ink-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="flex items-center gap-2.5 rounded-xs border border-ink-900/[0.08] bg-white px-3.5 py-2.5">
          <CalendarDays className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
          <span className="text-[0.75rem] text-ink-700">{formatStamp(event.starts_at)}</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-xs border border-ink-900/[0.08] bg-white px-3.5 py-2.5">
          <MapPin className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
          <span className="truncate text-[0.75rem] text-ink-700">{event.venue_name}</span>
        </div>
      </div>

      {/* Edit form */}
      {can(user.role, "events.manage") ? (
        <EventForm
          event={{
            id: event.id,
            title: event.title,
            slug: event.slug,
            theme: event.theme ?? "",
            description: event.description ?? "",
            startsAt: event.starts_at,
            endsAt: event.ends_at ?? "",
            venueName: event.venue_name ?? "",
            venueAddress: event.venue_address ?? "",
            capacity: event.capacity ?? 0,
            status: event.status,
            registrationOpen: event.registration_open === 1,
          }}
          departments={departments.map((d) => ({ id: d.id, name: d.name, capacity: d.capacity }))}
        />
      ) : (
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
          <p className="text-[0.75rem] text-ink-500">You have read-only access to event settings.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/registrations?event=${event.id}`} className="btn-outline btn-sm">
          <Users className="h-3.5 w-3.5" />
          View registrations
        </Link>
        <Link href={`/admin/volunteers`} className="btn-outline btn-sm">
          Volunteers
        </Link>
        <Link href={`/admin/programme`} className="btn-outline btn-sm">
          Programme
        </Link>
      </div>
    </div>
  );
}
