import type { Metadata } from "next";
import Link from "next/link";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/public/PageHero";
import { getEventBundle, getFeaturedEvent } from "@/lib/data/events";
import { eventDateParts, formatEventDate } from "@/lib/format";


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programme",
  description: "The order of service for the next EphaPhata gathering.",
};

export default function ProgrammePage() {
  const featured = getFeaturedEvent();

  // A fresh deployment has no events yet. That is an empty state, not a broken
  // link - the route must still resolve for search engines and for the nav.
  if (!featured) {
    return (
      <EmptySchedule
        title="THE PROGRAMME"
        message="The order of service is published once the next gathering is confirmed. Check the events page for what is coming."
      />
    );
  }

  const bundle = getEventBundle(featured.slug);
  if (!bundle) {
    return (
      <EmptySchedule
        title="THE PROGRAMME"
        message="The order of service for this gathering has not been published yet."
      />
    );
  }

  const { event, schedule } = bundle;
  const d = eventDateParts(event.starts_at);
  const total = schedule.reduce((a, s) => a + s.duration_min, 0);

  // Derive running times from the event start so the page reads like a printed
  // order of service.
  let cursor = new Date(event.starts_at).getTime();
  const timed = schedule.map((item) => {
    const start = new Date(cursor);
    cursor += item.duration_min * 60_000;
    return { ...item, at: start };
  });

  return (
    <>
      <PageHero
        eyebrow="Order of service"
        title="THE PROGRAMME"
        family="pink"
        priority
        meta={[
          { label: "Gathering", value: event.title },
          { label: "Date", value: formatEventDate(event.starts_at) },
          { label: "Venue", value: event.venue_name ?? "To be confirmed" },
          { label: "Runtime", value: `Approx. ${Math.floor(total / 60)}h ${total % 60}m · ${schedule.length} segments` },
        ]}
      />

      <section className="bg-white py-12 lg:py-16">
        <div className="shell-wide">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 flex items-center justify-between border-b border-ink-900/10 pb-4">
              <p className="eyebrow text-ink-400">Timeline</p>
              <p className="text-[0.6875rem] text-ink-400">Provisional - subject to change</p>
            </div>

            <ol>
              {timed.map((item, i) => (
                <Reveal key={item.id} delay={i * 50} duration={400}>
                  <li className="grid grid-cols-[1fr] gap-2 border-b border-ink-900/12 py-6 sm:grid-cols-[76px_1fr_auto] sm:items-baseline sm:gap-6">
                    <div className="flex items-center gap-2 sm:block">
                      <span className="font-display text-[0.9375rem] tabular-nums leading-none text-ink-900">
                        {item.at.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Africa/Lagos",
                        })}
                      </span>
                      <span className="text-[0.625rem] uppercase tracking-wide text-ink-400 sm:mt-1 sm:block">
                        {item.duration_min} min
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-display text-[1.05rem] uppercase tracking-[0.01em] text-ink-900 sm:text-[1.25rem]">
                        {item.title}
                      </h2>
                      {item.description && (
                        <p className="mt-1.5 max-w-xl text-[0.8125rem] leading-relaxed text-ink-600">
                          {item.description}
                        </p>
                      )}
                      {item.speaker && (
                        <p className="mt-2 label-xs text-ink-400">{item.speaker}</p>
                      )}
                    </div>

                    <span className="hidden text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-300 sm:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </li>
                </Reveal>
              ))}

              {schedule.length === 0 && (
                <li className="py-10 text-center text-[0.875rem] text-ink-500">
                  The programme for this gathering has not been published yet.
                </li>
              )}
            </ol>

            <Reveal delay={200}>
              <div className="mt-10 border-t-2 border-ink-900 pt-6">
                <p className="max-w-2xl text-[0.8125rem] leading-relaxed text-ink-600">
                  <strong className="font-semibold text-ink-900">Please note:</strong> EphaPhata is
                  an all-standing gathering. There are no physical seats available during the event.
                  Arriving before the start time means you will be settled before the first sound.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link href={`/events/${event.slug}`} className="btn-ink btn-sm">
                    Event details
                  </Link>
                  <Link href={`/events/${event.slug}/register`} className="btn-outline btn-sm">
                    Register
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

/** Honest empty state — no fabricated schedule, no 404. */
function EmptySchedule({ title, message }: { title: string; message: string }) {
  return (
    <>
      <PageHero eyebrow="Order of service" title={title} family="pink" priority />
      <section className="bg-white py-16 lg:py-20">
        <div className="shell-wide max-w-2xl">
          <p className="text-[1rem] leading-relaxed text-ink-600">{message}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/events" className="btn-ink">
              See upcoming events
            </Link>
            <Link href="/" className="btn-outline">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
