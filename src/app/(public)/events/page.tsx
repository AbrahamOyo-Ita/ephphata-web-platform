import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { EventCard } from "@/components/public/EventCard";
import { BrandBG } from "@/components/brand/BrandBG";
import { listEvents } from "@/lib/data/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past EphaPhata gatherings.",
};

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  return <EventsList searchParams={searchParams} />;
}

async function EventsList({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const params = await searchParams;
  const view = params.view === "past" ? "past" : "upcoming";
  const query = (params.q ?? "").trim().toLowerCase();

  const all = listEvents();
  const now = Date.now();

  let upcoming = all
    .filter((e) => ["published", "registration_closed", "live"].includes(e.status))
    .filter((e) => new Date(e.starts_at).getTime() >= now - 86_400_000)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

  let past = all
    .filter((e) => ["completed", "archived"].includes(e.status) || new Date(e.starts_at).getTime() < now)
    .sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at));

  if (query) {
    const match = (e: { title: string; venue_name: string | null; edition_label: string | null }) =>
      `${e.title} ${e.venue_name ?? ""} ${e.edition_label ?? ""}`.toLowerCase().includes(query);
    upcoming = upcoming.filter(match);
    past = past.filter(match);
  }

  const shown = view === "past" ? past : upcoming;

  return (
    <>
      <section className="bg-white pb-12 pt-24 lg:pb-16 lg:pt-32">
        <div className="shell-wide">
          <Reveal duration={400}>
            <p className="label-xs text-ink-400">Events</p>
          </Reveal>

          <SplitText
            as="h1"
            text="THE GATHERINGS"
            className="mt-4 block font-display text-display-lg text-ink-900"
            step={58}
            trigger="mount"
          />

          <Reveal delay={200}>
            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Tabs */}
              <div
                role="tablist"
                aria-label="Event view"
                className="inline-flex rounded-xs border border-ink-900/10 bg-paper-50 p-1"
              >
                {[
                  { key: "upcoming", label: `Upcoming (${upcoming.length})` },
                  { key: "past", label: `Past (${past.length})` },
                ].map((tab) => {
                  const active = view === tab.key;
                  return (
                    <Link
                      key={tab.key}
                      href={`/events${tab.key === "past" ? "?view=past" : ""}`}
                      role="tab"
                      aria-selected={active}
                      className={`rounded-xs px-4 py-2 text-[0.8125rem] font-semibold transition-colors duration-300 ${
                        active ? "bg-ink-900 text-white" : "text-ink-600 hover:text-ink-900"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>

              {/* Search */}
              <form action="/events" method="get" className="relative max-w-xs w-full">
                {view === "past" && <input type="hidden" name="view" value="past" />}
                <label htmlFor="event-search" className="sr-only">
                  Search events
                </label>
                <input
                  id="event-search"
                  name="q"
                  type="search"
                  defaultValue={params.q ?? ""}
                  placeholder="Search by name or venue"
                  className="input py-2.5 pl-4 pr-10 text-[0.8125rem]"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-ink-900/[0.06] hover:text-ink-900"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-section">
        <div className="shell-wide">
          {shown.length === 0 ? (
            <div className="rounded-md border border-dashed border-ink-900/20 bg-paper-50 p-14 text-center">
              <p className="font-display text-xl uppercase tracking-wide text-ink-700">
                Nothing here yet
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[0.875rem] leading-relaxed text-ink-500">
                {query
                  ? `No ${view} gathering matches “${params.q}”.`
                  : view === "past"
                    ? "Past editions will appear here once they are marked complete."
                    : "There is no gathering open for registration right now. Subscribe below and we will tell you the moment one opens."}
              </p>
              <Link href="/events" className="btn-outline btn-sm mt-6">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((event, i) => (
                <Reveal key={event.id} delay={i * 80}>
                  <EventCard event={event} past={view === "past"} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <BrandBG family="green" overlay className="text-white">
        <div className="shell-wide py-14 lg:py-16">
          <div className="flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="label-xs text-white/60">The list</p>
              <h2 className="mt-3 font-display text-display-sm uppercase text-white">
                NEW EDITIONS ARE ANNOUNCED FIRST TO THE LIST
              </h2>
              <p className="mt-3 max-w-lg text-[0.875rem] text-white/75">
                One message when registration opens. Nothing else.
              </p>
            </div>
            <Link href="/#newsletter" className="btn-white group shrink-0">
              Join the list
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </BrandBG>
    </>
  );
}
