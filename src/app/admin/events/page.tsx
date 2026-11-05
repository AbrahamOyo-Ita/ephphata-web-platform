import Link from "next/link";
import { CalendarDays, MapPin, Users, ExternalLink, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listEvents } from "@/lib/data/events";
import { registrationStats } from "@/lib/data/registrations";
import { formatStamp } from "@/lib/format";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { DemoBanner } from "@/components/admin/DemoBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

type Tone = "emerald" | "violet" | "azure" | "magenta" | "amber" | "flame" | "neutral";

const EVENT_TONES: Record<string, Tone> = {
  published: "emerald",
  live: "magenta",
  draft: "neutral",
  registration_closed: "amber",
  completed: "neutral",
  archived: "neutral",
};

export default async function EventsPage() {
  const user = await requireUser("events.view");
  const events = listEvents({ includeAll: true });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">Events</p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
            Gatherings
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            {events.length} event{events.length === 1 ? "" : "s"} across every edition
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <DemoBanner compact />
          {can(user.role, "events.manage") && (
            <Link href="/admin/events/new" className="btn-ink btn-sm">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
              New event
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((e) => {
          const stats = registrationStats(e.id);
          const isFeatured = e.status === "published" || e.status === "live";
          return (
            <Link
              key={e.id}
              href={`/admin/events/${e.id}`}
              className="group relative overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white p-4 transition-colors hover:border-ink-900/20"
            >
              {isFeatured && (
                <span className="absolute right-0 top-0 rounded-bl-lg bg-ink-900 px-2 py-1 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-white">
                  Active
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <StatusBadge
                  tone={EVENT_TONES[e.status] ?? "neutral"}
                  label={STATUS_LABELS[e.status] ?? e.status.replace("_", " ")}
                />
              </div>

              <h2 className="mt-2.5 text-[1rem] font-semibold leading-snug text-ink-900 group-hover:text-ink-700">
                {e.title}
              </h2>
              {e.theme && <p className="mt-0.5 text-[0.6875rem] italic text-ink-400">{e.theme}</p>}

              <dl className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-[0.6875rem] text-ink-600">
                  <CalendarDays className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.2} />
                  {formatStamp(e.starts_at)}
                </div>
                <div className="flex items-center gap-2 text-[0.6875rem] text-ink-600">
                  <MapPin className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.2} />
                  <span className="truncate">{e.venue_name}</span>
                </div>
                <div className="flex items-center gap-2 text-[0.6875rem] text-ink-600">
                  <Users className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.2} />
                  {stats.total} registered · {stats.checkedIn} checked in
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-between border-t border-ink-900/[0.06] pt-2.5">
                <span className="font-mono text-[0.5625rem] text-ink-400">/{e.slug}</span>
                <ExternalLink className="h-3 w-3 text-ink-300 transition-colors group-hover:text-violet-600" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
