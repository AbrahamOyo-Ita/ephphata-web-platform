import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Flyer } from "@/components/brand/BrandBG";
import { eventDateParts } from "@/lib/format";
import type { EventRow } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  published: "Registration open",
  registration_closed: "Registration closed",
  live: "Happening now",
  completed: "Completed",
  archived: "Archived",
  draft: "Draft",
};

/**
 * Edition card.
 * Flat editorial block: hard-edged poster, name set tight beneath, metadata
 * ruled. No shadow, no lift, no image zoom, no floating date chip. Hover
 * changes the title colour and the arrow - nothing moves.
 */
export function EventCard({ event, past = false }: { event: EventRow; past?: boolean }) {
  const d = eventDateParts(event.starts_at);
  const open = event.status === "published" && event.registration_open === 1;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col border border-ink-900/12 bg-white transition-colors duration-200 hover:border-ink-900/40"
    >
      <div className="relative">
        <Flyer
          slug={flyerSlug(event.poster_url)}
          alt={`${event.title} poster`}
          ratio="4 / 5"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {!past && (
          <span
            className={`absolute left-0 top-0 tag-block ${
              event.status === "live"
                ? "bg-flame-500 text-white"
                : open
                  ? "bg-emerald-600 text-white"
                  : "bg-ink-900 text-white"
            }`}
          >
            {STATUS_LABEL[event.status] ?? event.status}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Date line, flyer-style: weekday · day month · time */}
        <p className="text-[0.75rem] text-ink-500">
          {d.weekday} {d.day} {d.monthShort} {d.year}
        </p>

        <h3 className="mt-2 font-display text-[1.25rem] uppercase leading-tight tracking-[0.02em] text-ink-900 transition-colors duration-200 group-hover:text-emerald-700">
          {event.title}
        </h3>

        {event.theme && (
          <p className="mb-5 mt-1 font-editorial text-[0.9375rem] italic text-ink-500">{event.theme}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            {event.edition_label && (
              <p className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-ink-400">
                {event.edition_label} EDITION
              </p>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] text-ink-500">
              <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
              <span className="truncate">{event.venue_name ?? "To be confirmed"}</span>
            </p>
          </div>
          <span className="shrink-0 text-ink-900 transition-transform duration-200 group-hover:translate-x-0.5 group-">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Maps a poster_url path to the optimised derivative slug. */
function flyerSlug(posterUrl: string | null): string {
  if (!posterUrl) return "festival-multicolor";
  const match = posterUrl.match(/\/brand\/flyers\/([a-z0-9-]+)\./);
  return match?.[1] ?? "festival-multicolor";
}
