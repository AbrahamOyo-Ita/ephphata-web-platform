import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { Flyer } from "@/components/brand/BrandBG";

const PILLARS = [
  {
    title: "Sound",
    body: "Worship led by OT Power & The Attackers - built for the room, from the first note.",
  },
  {
    title: "The Word",
    body: "Ministers from across the country opening the scriptures without dilution.",
  },
  {
    title: "The People",
    body: "A hall full of people who came expecting something, and left carrying it.",
  },
];

/**
 * About block.
 * ------------------------------------------------------------------
 * White reading surface, hard-edged artwork, no offset colour frame and no
 * floating quote card. The narrative is carried by type; the credo sits in the
 * text column as a ruled pull-quote instead of a card overlapping the image.
 */
export function AboutBlock() {
  return (
    <section className="bg-white py-section" aria-labelledby="about-heading">
      <div className="shell-wide">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* Copy */}
          <div>
            <Reveal duration={400}>
              <p className="label-xs text-ink-400">About the gathering</p>
            </Reveal>

            <SplitText
              as="h2"
              id="about-heading"
              text="A ROOM SET APART. A PEOPLE OPENED."
              className="mt-4 block font-display text-display-md text-ink-900"
              step={44}
            />

            <p className="mt-7 max-w-xl text-[1.0625rem] leading-relaxed text-ink-700">
              Ephphata is a gathering built around a single invitation - to be opened.
              It is not a concert with a message attached; it is a room where worship,
              the word and prayer are given room to do their work.
            </p>

            <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-ink-500">
              Each edition is hosted by <strong className="font-semibold text-ink-900">OT Power &amp; The Attackers</strong>,
              with guest ministers joining from across the country. The gathering has grown
              edition after edition, carried mostly by people who came once and brought someone
              the next time.
            </p>

            {/* Credo as a ruled pull-quote - flat, editorial */}
            <figure className="mt-10">
              <blockquote className="font-editorial text-[clamp(1.3rem,2.6vw,1.9rem)] italic leading-snug text-ink-900">
                &ldquo;Be opened.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[0.8125rem] text-ink-400">Mark 7:34</figcaption>
            </figure>

            {/* Pillars: three ruled columns, no icons, no cards */}
            <dl className="mt-10 grid gap-8 sm:grid-cols-3">
              {PILLARS.map((pillar, i) => (
                <Reveal key={pillar.title} delay={i * 70} duration={400}>
                  <div>
                    <dt className="font-display text-[1.0625rem] uppercase tracking-[0.02em] text-ink-900">
                      {pillar.title}
                    </dt>
                    <dd className="mt-2 text-[0.8125rem] leading-relaxed text-ink-500">{pillar.body}</dd>
                  </div>
                </Reveal>
              ))}
            </dl>

            <Link href="/about" className="link-sweep mt-10 inline-flex text-[0.875rem] text-ink-900">
              Read the full story
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Artwork - hard rectangle, no frame, no overlap */}
          <div className="lg:pt-2">
            <Reveal duration={500}>
              <Flyer
                slug="unical-portrait"
                alt="Official Ephphata UNICAL portrait artwork"
                ratio="1024 / 1280"
                sizes="(max-width: 1024px) 100vw, 46vw"
              />
            </Reveal>

          </div>
        </div>
      </div>
    </section>
  );
}
