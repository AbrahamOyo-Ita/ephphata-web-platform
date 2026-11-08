import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass, Sparkles, HeartHandshake } from "lucide-react";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { BrandBG, Flyer } from "@/components/brand/BrandBG";
import { SectionHeading } from "@/components/public/SectionHeading";
import { MarqueeBand } from "@/components/public/MarqueeBand";
import { getContentPage, listTestimonials } from "@/lib/data/content";
import { getPastEvents } from "@/lib/data/events";
import { EventCard } from "@/components/public/EventCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story, mission and vision of Ephphata - a worship and spiritual gathering with OT Power & The Attackers.",
};

const VALUES = [
  {
    icon: Sparkles,
    title: "Worship without dilution",
    body: "The sound is not a warm-up for the message. It is given its own room and its own time.",
    colour: "text-ink-900",
  },
  {
    icon: Compass,
    title: "The word, plainly",
    body: "Ministers are invited to open the scriptures, not to perform. Clarity over showmanship.",
    colour: "text-ink-900",
  },
  {
    icon: HeartHandshake,
    title: "People, not numbers",
    body: "Registration exists so every person is accounted for and no one is lost in the crowd.",
    colour: "text-ink-900",
  },
];

export default function AboutPage() {
  const story = getContentPage("about-story");
  const mission = getContentPage("mission");
  const past = getPastEvents(3);
  const testimonials = listTestimonials(true);

  return (
    <>
      {/* ── Page hero ─────────────────────────────────────────── */}
      <section className="relative bg-white pb-16 pt-24 lg:pb-20 lg:pt-32">
        <div className="shell-wide">
          <Reveal duration={400}>
            <p className="label-xs text-ink-400">About</p>
          </Reveal>

          <SplitText
            as="h1"
            text="THE GATHERING"
            className="mt-6 block font-display text-display-lg text-ink-900"
            step={60}
            trigger="mount"
          />

          <div className="mt-6 flex flex-wrap items-baseline gap-x-4">
            <span className="font-editorial text-[clamp(1.6rem,4vw,3rem)] italic leading-none text-ink-500">
              one name, one invitation
            </span>
          </div>

          <Reveal delay={240}>
            <p className="mt-8 max-w-2xl text-body-lg leading-relaxed text-ink-600">
              Ephphata is a worship and spiritual gathering hosted by OT Power & The Attackers.
              What began as a single evening in Calabar has become a recurring gathering that
              people travel for.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-6 flex items-center gap-3 text-[0.75rem] text-ink-400">
              <span className="rounded-xs bg-paper-100 px-3 py-1.5 font-medium">
                Narrative content is editable from the operations dashboard
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Story + image ─────────────────────────────────────── */}
      <section className="bg-white pb-section">
        <div className="shell-wide">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              {story?.body ? (
                story.body.split("\n\n").map((para, i) => (
                  <Reveal key={i} delay={i * 90}>
                    <p
                      className={
                        i === 0
                          ? "text-body-lg leading-relaxed text-ink-800"
                          : "mt-5 text-[0.9375rem] leading-relaxed text-ink-600"
                      }
                    >
                      {para}
                    </p>
                  </Reveal>
                ))
              ) : (
                <Reveal>
                  <p className="text-ink-500">
                    The story for this page has not been published yet. It is managed from
                    Admin → Content.
                  </p>
                </Reveal>
              )}
            </div>

            <Reveal variant="scale" delay={140}>
              <div className="relative">
                <div className="relative overflow-hidden rounded-xs ring-1 ring-ink-900/10">
                  <Flyer
                    slug="festival-lineup"
                    alt="Ephphata festival line-up artwork"
                    ratio="2 / 1"
                    sizes="(max-width: 1024px) 100vw, 44vw"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <MarqueeBand
        phrases={["Ephphata", "Be opened", "Calabar", "Sound", "The Word", "Prayer", "The new"]}
        variant="light"
      />

      {/* ── Mission / vision ──────────────────────────────────── */}
      <BrandBG family="pink" overlay className="text-white">
        <div className="shell-wide py-section">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <Reveal duration={400}>
                <p className="label-xs text-white/50">Mission &amp; vision</p>
              </Reveal>
              <SplitText
                as="h2"
                text="WHY WE GATHER"
                className="mt-4 block font-display text-display-md text-white"
                step={54}
              />
            </div>
            <div>
              {mission?.body?.split("\n\n").map((para, i) => (
                <Reveal key={i} delay={i * 110}>
                  <p className="mb-5 text-body-lg leading-relaxed text-white/80">{para}</p>
                </Reveal>
              ))}
              <div className="mt-10 space-y-6 border-t border-white/20 pt-8">
                {VALUES.map((v, i) => (
                  <Reveal key={v.title} delay={i * 80}>
                    <div className="flex gap-4">
                      <v.icon className="mt-0.5 h-4 w-4 shrink-0 text-white/60" strokeWidth={1.9} />
                      <div>
                        <h3 className="font-display text-base uppercase tracking-wide text-white">
                          {v.title}
                        </h3>
                        <p className="mt-1 text-[0.8125rem] leading-relaxed text-white/60">{v.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BrandBG>

      {/* ── Previous editions ─────────────────────────────────── */}
      {past.length > 0 && (
        <section className="bg-paper-50 py-section">
          <div className="shell-wide">
            <SectionHeading
              eyebrow="Archive"
              title="WHERE WE'VE BEEN"
              description="Each edition keeps its own record - its own programme, its own team, its own gallery."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, i) => (
                <Reveal key={event.id} delay={i * 90}>
                  <EventCard event={event} past />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonies: explicit about approved-only ──────────── */}
      <section className="bg-white py-section">
        <div className="shell-wide">
          <SectionHeading
            eyebrow="Testimonies"
            title="WHAT PEOPLE CARRY HOME"
            description="Only testimonies that have been given with explicit permission appear here."
          />

          {testimonials.length > 0 ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 90}>
                  <blockquote className="h-full rounded-md border border-ink-900/[0.08] bg-paper-50 p-6">
                    <p className="font-editorial text-[1.15rem] italic leading-snug text-ink-800">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <footer className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                      {t.author_name}
                      {t.author_role && ` · ${t.author_role}`}
                    </footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div className="mt-10 rounded-md border border-dashed border-ink-900/20 bg-paper-50 p-8 text-center">
                <p className="font-display text-lg uppercase tracking-wide text-ink-700">
                  Awaiting approved testimonies
                </p>
                <p className="mx-auto mt-2 max-w-md text-[0.8125rem] leading-relaxed text-ink-500">
                  No testimony is published without explicit, documented permission. Approved
                  submissions will appear here once the follow-up team has collected consent.
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Closing ───────────────────────────────────────────── */}
      <BrandBG family="blue" overlay className="text-white">
        <div className="shell-wide py-16 lg:py-20">
          <div className="max-w-3xl">
            <SplitText
              as="h2"
              text="COME AND SEE."
              className="block font-display text-display-md text-white"
              step={58}
            />
            <Reveal delay={160}>
              <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-white/80">
                The next gathering is open for registration. It takes a minute.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <Link href="/events" className="btn-white btn-lg group mt-8 inline-flex">
                See upcoming events
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={2.6}
                />
              </Link>
            </Reveal>
          </div>
        </div>
      </BrandBG>
    </>
  );
}
