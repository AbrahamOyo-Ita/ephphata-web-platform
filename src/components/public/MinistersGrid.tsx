import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { initials } from "@/lib/format";
import type { SpeakerRow } from "@/lib/types";

/**
 * Ministers and guests.
 * ------------------------------------------------------------------
 * The flyers stack portraits as hard-edged rectangles with the name set tight
 * beneath. No card container, no shadow, no hover lift, no zooming image. Where
 * an approved photograph has not been supplied, a flat colour block with the
 * monogram is used and clearly marked - no invented faces.
 */

/** Flat brand blocks for portrait placeholders - no gradients. */
const BLOCKS = ["bg-ink-900", "bg-emerald-700", "bg-violet-900", "bg-azure-900", "bg-flame-900"];

export function MinistersGrid({ speakers }: { speakers: SpeakerRow[] }) {
  return (
    <section className="bg-white py-section" aria-labelledby="ministers-heading">
      <div className="shell-wide">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal duration={400}>
              <p className="label-xs text-ink-400">On the platform</p>
            </Reveal>
            <SplitText
              as="h2"
              id="ministers-heading"
              text="MINISTERS & GUESTS"
              className="mt-4 block font-display text-display-md text-ink-900"
              step={42}
            />
          </div>
          <p className="max-w-xs text-[0.8125rem] leading-relaxed text-ink-500">
            Line-up from the official UNICAL flyer.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-5">
          {speakers.map((speaker, i) => {
            const isHost = speaker.role === "Host";
            return (
              <Reveal key={speaker.id} delay={i * 45} duration={400}>
                <article>
                  <div className="relative aspect-[4/5] overflow-hidden bg-paper-100">
                    {speaker.photo_url ? (
                      <img
                        src={speaker.photo_url}
                        alt={speaker.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center ${
                          isHost ? "bg-ink-900" : BLOCKS[i % BLOCKS.length]
                        }`}
                      >
                        <span className="font-display text-[clamp(2rem,5vw,3rem)] leading-none text-white/90">
                          {initials(speaker.name)}
                        </span>
                      </div>
                    )}

                    {isHost && (
                      <span className="absolute left-0 top-0 tag-block bg-gold-500 text-ink-900">
                        Host
                      </span>
                    )}
                  </div>

                  {/* Name sits directly beneath the portrait - flyer behaviour */}
                  <h3 className="mt-3 font-display text-[1rem] uppercase leading-tight tracking-[0.02em] text-ink-900">
                    {speaker.name}
                  </h3>
                  <p className="mt-1 text-[0.75rem] text-ink-400">{speaker.role ?? "Guest"}</p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-12 text-[0.75rem] leading-relaxed text-ink-400">
          Approved photography is pending; monograms are used instead of unapproved imagery.
        </p>
      </div>
    </section>
  );
}
