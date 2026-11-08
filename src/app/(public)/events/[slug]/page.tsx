import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Ticket,
  Share2,
  Music4,
} from "lucide-react";
import { BrandBG, Flyer } from "@/components/brand/BrandBG";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { Countdown } from "@/components/motion/Countdown";
import { ProgrammePreview } from "@/components/public/ProgrammePreview";
import { MinistersGrid } from "@/components/public/MinistersGrid";
import { eventDateParts, formatEventDate, buildIcs } from "@/lib/format";
import { canRegisterErrorMessage, getEventBundle, isRegistrationOpen } from "@/lib/data/events";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bundle = getEventBundle(slug, { publicOnly: true });
  if (!bundle) return { title: "Event not found" };
  return {
    title: bundle.event.title,
    description: bundle.event.summary ?? undefined,
    openGraph: {
      title: bundle.event.title,
      description: bundle.event.summary ?? undefined,
      images: bundle.event.poster_url ? [{ url: bundle.event.poster_url }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = getEventBundle(slug, { publicOnly: true });
  if (!bundle) notFound();

  const { event, speakers, schedule, faqs } = bundle;
  const d = eventDateParts(event.starts_at);
  const open = isRegistrationOpen(event);
  const closedReason = canRegisterErrorMessage(event);

  const registeredCount = (
    db
      .prepare(
        "SELECT count(*) AS n FROM registrations WHERE event_id = ? AND status='confirmed' AND deleted_at IS NULL"
      )
      .get(event.id) as { n: number }
  ).n;

  const ics = buildIcs({
    title: event.title,
    description: event.summary ?? "Ephphata",
    location: [event.venue_name, event.venue_address].filter(Boolean).join(", "),
    start: event.starts_at,
    end: event.ends_at ?? event.starts_at,
    uid: event.id,
  });
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;

  const family = event.hero_bg as "green" | "multicolor" | "red" | "pink" | "blue";

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <BrandBG family={family} priority overlay className="text-white">
        <div className="shell-wide pb-14 pt-28 lg:pb-16 lg:pt-32">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="tag-block bg-white text-ink-900">
                  {open ? "Registration open" : event.status === "completed" ? "Completed" : "Closed"}
                </span>
                {event.edition_label && (
                  <span className="label-xs text-white/60">{event.edition_label} Edition</span>
                )}
                <span className="label-xs text-white/50">{d.year}</span>
              </div>

              <SplitText
                as="h1"
                text={event.title.toUpperCase()}
                className="mt-5 block font-display text-display-lg text-white"
                step={54}
                trigger="mount"
              />

              <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="font-editorial text-[clamp(1.5rem,3.4vw,2.6rem)] italic leading-none text-white">
                  {event.theme ? event.theme.toLowerCase() : "the new"}
                </span>
                <span className="label-xs text-white/60">{event.scripture}</span>
              </div>

              <p className="mt-6 max-w-xl text-[1rem] leading-relaxed text-white/85">
                {event.summary}
              </p>

              <dl className="mt-9 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  { icon: CalendarDays, label: "Date", value: `${d.weekday} ${d.dayNum} ${d.month} ${d.year}` },
                  { icon: Clock, label: "Start", value: `${d.time} · doors open an hour before` },
                  { icon: MapPin, label: "Venue", value: event.venue_name ?? "To be confirmed" },
                  { icon: Users, label: "Registered", value: `${registeredCount} people` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <dt className="flex items-center gap-1.5 text-[0.75rem] text-white/55">
                      <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {label}
                    </dt>
                    <dd className="mt-1 text-[0.875rem] font-medium leading-snug text-white">{value}</dd>
                  </div>
                ))}
              </dl>

              {open && (
                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  <span className="label-xs text-white/50">Doors open in</span>
                  <Countdown target={event.starts_at} variant="inline" className="text-white" />
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {open ? (
                  <Link href={`/events/${event.slug}/register`} className="btn-white btn-lg group">
                    <Ticket className="h-4 w-4" strokeWidth={2.2} />
                    Register - it&apos;s free
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2.6}
                    />
                  </Link>
                ) : (
                  <span className="btn border border-white/45 text-white/80">
                    {event.status === "completed" ? "This gathering has taken place" : "Registration closed"}
                  </span>
                )}
                <a href={icsHref} download={`${event.slug}.ics`} className="btn-outline-light btn-lg">
                  <CalendarDays className="h-4 w-4" />
                  Add to calendar
                </a>
              </div>

              {closedReason && (
                <p className="mt-5 max-w-md text-[0.75rem] leading-relaxed text-white/65">
                  {closedReason}
                </p>
              )}
            </div>

            {/* Flyer, sitting on the artwork like a poster */}
            <div className="w-full max-w-[260px] lg:ml-auto lg:mt-2">
              <Flyer
                slug={posterSlug(event.poster_url)}
                alt={`${event.title} official flyer`}
                ratio="4 / 5"
                priority
                sizes="(max-width: 1024px) 60vw, 260px"
              />
            </div>
          </div>
        </div>
      </BrandBG>

      {/* ── About + logistics ─────────────────────────────────── */}
      <section className="bg-white py-section">
        <div className="shell-wide">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <Reveal variant="fade">
                <p className="eyebrow text-ink-600">About this gathering</p>
              </Reveal>
              <SplitText
                as="h2"
                text="WHAT TO EXPECT"
                className="mt-5 block font-display text-display-sm text-ink-900"
                step={48}
              />
              <div className="mt-6 space-y-4">
                {(event.description ?? event.summary ?? "").split("\n\n").map((para, i) => (
                  <Reveal key={i} delay={i * 80}>
                    <p className="text-[0.9375rem] leading-relaxed text-ink-600">{para}</p>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Venue panel */}
            <Reveal delay={140} variant="right">
              <div className="rounded-md border border-ink-900/[0.08] bg-paper-50 p-6">
                <p className="eyebrow text-ink-400">The venue</p>
                <h3 className="mt-3 font-display text-lg uppercase tracking-wide text-ink-900">
                  {event.venue_name ?? "Venue to be confirmed"}
                </h3>
                {event.venue_address && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] leading-relaxed text-ink-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    {event.venue_address}
                  </p>
                )}

                <div className="mt-5 space-y-2.5 border-t border-ink-900/10 pt-4 text-[0.8125rem]">
                  <div className="flex justify-between gap-4">
                    <span className="text-ink-400">Date</span>
                    <span className="font-medium text-ink-800">{formatEventDate(event.starts_at)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ink-400">Entry</span>
                    <span className="font-medium text-ink-800">Free - registration required</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ink-400">Seating</span>
                    <span className="font-medium text-ink-800">All-standing</span>
                  </div>
                </div>

                {event.maps_url && (
                  <a
                    href={event.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline btn-sm mt-5 w-full"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Open in maps
                  </a>
                )}

                {event.contact_email && (
                  <p className="mt-4 border-t border-ink-900/10 pt-3 text-[0.6875rem] leading-relaxed text-ink-400">
                    Questions? <a href={`mailto:${event.contact_email}`} className="font-medium text-ink-700 underline decoration-ink-900/20 underline-offset-2 hover:decoration-ink-900">{event.contact_email}</a>
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {speakers.length > 0 && <MinistersGrid speakers={speakers} />}
      {schedule.length > 0 && <ProgrammePreview schedule={schedule} />}

      {/* ── FAQs ──────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="bg-white py-section">
          <div className="shell-wide">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <Reveal variant="fade">
                  <p className="eyebrow text-ink-600">Questions</p>
                </Reveal>
                <SplitText
                  as="h2"
                  text="BEFORE YOU COME"
                  className="mt-5 block font-display text-display-sm text-ink-900"
                  step={48}
                />
              </div>
              <div className="divide-y divide-ink-900/10 border-y border-ink-900/10">
                {faqs.map((faq, i) => (
                  <Reveal key={faq.id} delay={i * 60}>
                    <details className="group py-4">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[0.9375rem] font-semibold text-ink-900 marker:content-none">
                        {faq.question}
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-xs border border-ink-900/15 text-ink-500 transition-colors duration-300 group-open:rotate-45 group-open:border-ink-900 group-open:bg-ink-900 group-open:text-white">
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </span>
                      </summary>
                      <p className="mt-3 max-w-2xl pr-10 text-[0.875rem] leading-relaxed text-ink-600">
                        {faq.answer}
                      </p>
                    </details>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Share + volunteer ─────────────────────────────────── */}
      <section className="bg-paper-50 py-16">
        <div className="shell-wide">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow text-ink-400">Bring someone</p>
              <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink-700">
                Most people who come to Ephphata were brought by someone. Share this gathering.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${event.title} - ${formatEventDate(event.starts_at)} at ${event.venue_name}. ${site.url}/events/${event.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline btn-sm"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share on WhatsApp
              </a>
              <Link href="/volunteer" className="btn-outline btn-sm">
                <Music4 className="h-3.5 w-3.5" />
                Volunteer instead
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function posterSlug(posterUrl: string | null): string {
  if (!posterUrl) return "unical-lineup";
  return posterUrl.match(/\/brand\/flyers\/([a-z0-9-]+)\./)?.[1] ?? "unical-lineup";
}
