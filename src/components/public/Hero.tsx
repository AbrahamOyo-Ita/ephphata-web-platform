"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandBG } from "@/components/brand/BrandBG";
import { eventDateParts } from "@/lib/format";

type HeroEvent = {
  slug: string;
  title: string;
  editionLabel: string | null;
  theme: string | null;
  scripture: string | null;
  startsAt: string;
  registrationOpen: boolean;
};

/**
 * Homepage hero.
 * ------------------------------------------------------------------
 * This is the front door to the GATHERING, not to one edition. The headline is
 * the ministry's own statement; the next edition is named in a single line and
 * its dates live in the "next gathering" section below - deliberately not
 * repeated here (repeating When/Where/Doors and a countdown twice on one page
 * read as padding, not as design).
 *
 * The multicolor asset is the full background. White type sits on a soft wash
 * built from the artwork's own purples, so the pattern stays visible instead of
 * being cut off by a colour block.
 */
export function Hero({ event }: { event: HeroEvent | null }) {
  const nextLine = event
    ? `Next edition - ${event.title}, ${eventDateParts(event.startsAt).dayNum} ${eventDateParts(event.startsAt).month} ${eventDateParts(event.startsAt).year}`
    : "Next edition - Ephphata UNICAL 2026";

  return (
    <section className="text-white" aria-labelledby="hero-heading">
      <BrandBG family="multicolor" priority overlay className="min-h-[86svh]">
        <div className="flex min-h-[86svh] flex-col justify-end px-5 pb-14 pt-32 sm:px-8 lg:px-12 lg:pb-20 xl:px-16">
          <div className="w-full max-w-4xl">
            <p className="label-xs text-white/70">Ephphata · with OT Power &amp; The Attackers</p>

            <h1
              id="hero-heading"
              className="mt-5 font-display text-[clamp(2.4rem,6.8vw,5.8rem)] uppercase leading-[1.04] tracking-[-0.005em]"
            >
              ONE GATHERING.
              <br />
              ONE PURPOSE.
            </h1>

            <p className="mt-6 font-editorial text-[clamp(1.4rem,3vw,2.3rem)] italic leading-none text-white/95">
              be opened
            </p>

            <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-white/85">
              A worship and spiritual gathering held in Calabar - worship, the word and prayer
              given room to do their work. Free to attend, open to everyone.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/events" className="btn-white btn-lg group">
                See the next gathering
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={2.6}
                />
              </Link>
              <Link href="/about" className="btn-outline-light btn-lg">
                About Ephphata
              </Link>
            </div>

            <p className="mt-10 text-[0.8125rem] text-white/65">{nextLine}</p>
          </div>
        </div>
      </BrandBG>
    </section>
  );
}
