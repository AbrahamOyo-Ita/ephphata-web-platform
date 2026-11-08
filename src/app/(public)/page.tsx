import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/public/Hero";
import { MarqueeBand } from "@/components/public/MarqueeBand";
import { AboutBlock } from "@/components/public/AboutBlock";
import { ProgrammePreview } from "@/components/public/ProgrammePreview";
import { MinistersGrid } from "@/components/public/MinistersGrid";
import { RegistrationCTA } from "@/components/public/RegistrationCTA";
import { VolunteerInvite } from "@/components/public/VolunteerInvite";
import { PrayerCTA } from "@/components/public/PrayerCTA";
import { EventCard } from "@/components/public/EventCard";
import { SectionHeading } from "@/components/public/SectionHeading";
import { eventDateParts } from "@/lib/format";
import { StatsStrip } from "@/components/public/StatsStrip";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { BrandBG, Flyer } from "@/components/brand/BrandBG";
import {
  getFeaturedEvent,
  getPastEvents,
  getUpcomingEvents,
  isRegistrationOpen,
  canRegisterErrorMessage,
} from "@/lib/data/events";
import { db } from "@/lib/db";
import type { SpeakerRow, ScheduleRow } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Homepage.
 * ------------------------------------------------------------------
 * Colour rhythm - no two brand surfaces are ever adjacent:
 *
 *   1 Hero            multicolor asset
 *   2 Ticker          ink ground (thin)
 *   3 Upcoming event  green asset
 *   4 About           white
 *   5 Ministers       white
 *   6 Programme       paper-50 (off-white)
 *   7 Registration    red asset
 *   8 Volunteer       blue asset      ← separated by the prayer block below
 *   9 Prayer          white
 *  10 Previous        white
 *  11 Footer          ink ground
 */
export default function HomePage() {
  const featured = getFeaturedEvent();
  const upcoming = getUpcomingEvents(3).filter((e) => e.id !== featured?.id);
  const past = getPastEvents(3);

  const speakers = featured
    ? (db
        .prepare("SELECT * FROM event_speakers WHERE event_id = ? ORDER BY sort_order LIMIT 8")
        .all(featured.id) as SpeakerRow[])
    : [];

  const schedule = featured
    ? (db
        .prepare("SELECT * FROM event_schedule WHERE event_id = ? ORDER BY sort_order")
        .all(featured.id) as ScheduleRow[])
    : [];

  const regOpen = featured ? isRegistrationOpen(featured) : false;
  const closedReason = featured ? canRegisterErrorMessage(featured) : null;

  // Lagos-pinned formatting - never the server's local zone.
  const dateParts = featured ? eventDateParts(featured.starts_at) : null;

  return (
    <>
      {/* 1 ── Hero ─────────────────────────────────────────────── */}
      <Hero
        event={
          featured
            ? {
                slug: featured.slug,
                title: featured.title,
                editionLabel: featured.edition_label,
                theme: featured.theme,
                scripture: featured.scripture,
                startsAt: featured.starts_at,
                registrationOpen: regOpen,
              }
            : null
        }
      />

      {/* 2 ── Ticker (static) ──────────────────────────────────── */}
      <MarqueeBand
        phrases={[
          "Ephphata",
          "One gathering. One purpose.",
          "Sound",
          "The Word",
          "Prayer",
          "13 November 2026",
        ]}
        variant="dark"
      />

      {/* 3 ── Upcoming event: green asset full-bleed ───────────── */}
      <section className="text-white" aria-labelledby="upcoming-heading">
        <BrandBG family="green" overlay>
          <div className="shell-wide pb-16 pt-16 lg:pb-20 lg:pt-24">
            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
              <div className="max-w-2xl">
                <p className="label-xs text-white/60">The next gathering</p>

                <SplitText
                  as="h2"
                  id="upcoming-heading"
                  text={featured?.title ?? "EPHAPHATA UNICAL 2026"}
                  className="mt-4 block font-display text-display-lg text-white"
                  step={42}
                />

                <p className="mt-4 font-editorial text-[clamp(1.5rem,3.2vw,2.4rem)] italic leading-none text-white/95">
                  {featured?.theme?.toLowerCase() ?? "the new"}
                </p>

                <p className="mt-7 max-w-lg text-[1rem] leading-relaxed text-white/85">
                  {featured?.summary ??
                    "One gathering. One purpose. A live worship experience with OT Power & The Attackers."}
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={featured ? `/events/${featured.slug}/register` : "/events"}
                    className="btn-white btn-lg group"
                  >
                    Register for this gathering
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2.6}
                    />
                  </Link>
                  <Link
                    href={featured ? `/events/${featured.slug}` : "/events"}
                    className="btn-outline-light btn-lg"
                  >
                    Full event details
                  </Link>
                </div>
              </div>

              {/* Three facts, no rules, no labels */}
              <div className="space-y-7 lg:pb-2">
                <div>
                  <p className="font-display text-[1.0625rem] uppercase leading-tight text-white">
                    {dateParts
                      ? `${dateParts.weekday} ${dateParts.dayNum} ${dateParts.month} ${dateParts.year}`
                      : "Friday 13 November 2026"}
                  </p>
                  <p className="mt-1 text-[0.875rem] text-white/70">{dateParts?.time ?? "3:00PM"}</p>
                </div>

                <div>
                  <p className="font-display text-[1.0625rem] uppercase leading-tight text-white">
                    {featured?.venue_name ?? "UNICAL International Conference Centre"}
                  </p>
                  <p className="mt-1 text-[0.875rem] text-white/70">Calabar, Cross River State</p>
                </div>

                <div>
                  <p className="font-display text-[1.0625rem] uppercase leading-tight text-white">
                    Free to attend
                  </p>
                  <p className="mt-1 text-[0.875rem] text-white/70">
                    Registration required · all-standing
                  </p>
                </div>

                {featured?.maps_url && (
                  <a
                    href={featured.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-white underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    Open in maps
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="mt-16">
              <StatsStrip
                tone="light"
                stats={[
                  {
                    value: featured ? Number(eventDateParts(featured.starts_at).year) : 2026,
                    label: "Edition year",
                    note: "Ephphata UNICAL",
                  },
                  {
                    value: speakers.length,
                    label: "Ministers",
                    note: "From the official flyer",
                  },
                  { value: 10, label: "Departments", note: "Serving on the day" },
                  { value: 0, label: "Cost to attend", note: "Free - registration required" },
                ]}
              />
            </div>
          </div>
        </BrandBG>
      </section>

      {/* 4 ── About (white) ────────────────────────────────────── */}
      <AboutBlock />

      {/* 5 ── Ministers (white) ───────────────────────────────── */}
      {speakers.length > 0 && <MinistersGrid speakers={speakers} />}

      {/* 6 ── Programme (off-white) ───────────────────────────── */}
      {schedule.length > 0 && <ProgrammePreview schedule={schedule} />}

      {/* 7 ── Registration (red) ──────────────────────────────── */}
      <RegistrationCTA
        eventSlug={featured?.slug ?? null}
        eventTitle={featured?.title ?? "Ephaphata"}
        open={regOpen}
        note={closedReason}
      />

      {/* 9 ── Prayer (white) - breaks up the colour bands ─────── */}
      <PrayerCTA />

      {/* 8 ── Volunteer (blue) ────────────────────────────────── */}
      <VolunteerInvite />

      {/* 10 ── Previous editions (white) ──────────────────────── */}
      {past.length > 0 && (
        <section className="bg-white py-section" aria-labelledby="past-heading">
          <div className="shell-wide">
            <SectionHeading eyebrow="Archive" title="PREVIOUS EDITIONS" className="max-w-xl" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, i) => (
                <Reveal key={event.id} delay={i * 60} duration={400}>
                  <EventCard event={event} past />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other gatherings */}
      {upcoming.length > 0 && (
        <section className="bg-paper-50 py-section" aria-labelledby="upcoming-heading">
          <div className="shell-wide">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading eyebrow="Also coming" title="OTHER GATHERINGS" className="max-w-xl" />
              <Link href="/events" className="link-sweep self-start text-[0.875rem] text-ink-900 sm:self-auto">
                View all events
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, i) => (
                <Reveal key={event.id} delay={i * 60} duration={400}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing invitation - ink ground, flat */}
      <section className="bg-ink-900 py-16 text-white lg:py-20">
        <div className="shell-wide">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="max-w-2xl">
              <SplitText
                as="h2"
                text="COME AS YOU ARE. LEAVE DIFFERENT."
                className="mt-4 block font-display text-display-lg text-white"
                step={46}
              />
              <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href={featured ? `/events/${featured.slug}/register` : "/events"}
                  className="btn-white btn-lg group"
                >
                  Register
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-"
                    strokeWidth={2.6}
                  />
                </Link>
                <Link href="/contact" className="btn-outline-light btn-lg">
                  Talk to the team
                </Link>
              </div>
            </div>

            <div className="w-full max-w-[260px] justify-self-start lg:justify-self-end">
              <Flyer
                slug="unical-portrait"
                alt="Official Ephphata UNICAL artwork"
                ratio="1024 / 1280"
                sizes="260px"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
