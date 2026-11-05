import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import type { ScheduleRow } from "@/lib/types";

/**
 * Programme.
 * ------------------------------------------------------------------
 * A white, ruled order of service. The previous version sat on a heavily
 * darkened blue asset with a gradient wash; the artwork was invisible and the
 * section read as a dark "product" block. Flat rows and hairlines instead.
 * Colour is saved for the sections that genuinely need a brand surface.
 */
export function ProgrammePreview({ schedule }: { schedule: ScheduleRow[] }) {
  const totalMin = schedule.reduce((a, s) => a + s.duration_min, 0);

  return (
    <section className="bg-paper-50 py-section" aria-labelledby="programme-heading">
      <div className="shell-wide">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal duration={400}>
              <p className="label-xs text-ink-400">Order of service</p>
            </Reveal>
            <SplitText
              as="h2"
              id="programme-heading"
              text="HOW THE EVENING MOVES"
              className="mt-4 block font-display text-display-md text-ink-900"
              step={42}
            />
          </div>
          <p className="text-[0.8125rem] text-ink-500">Approx. {Math.round(totalMin / 60)}h {totalMin % 60}m</p>
        </div>

        {/* Flat rows: number · title · who · duration */}
        <ol className="mt-2">
          {schedule.map((item, i) => (
            <Reveal key={item.id} delay={i * 35} duration={360}>
              <li className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-4 py-5 sm:grid-cols-[3rem_1fr_10rem_5rem] sm:gap-x-6">
                <span className="font-display text-[1.125rem] leading-none tabular-nums text-ink-300">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0">
                  <h3 className="font-display text-[1.0625rem] uppercase leading-tight tracking-[0.02em] text-ink-900 sm:text-[1.25rem]">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 max-w-xl text-[0.8125rem] leading-relaxed text-ink-500">
                      {item.description}
                    </p>
                  )}
                </div>

                <span className="hidden text-[0.75rem] text-ink-500 sm:block">
                  {item.speaker ?? ""}
                </span>

                <span className="text-right text-[0.75rem] text-ink-500">
                  {item.duration_min} min
                </span>
              </li>
            </Reveal>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-[0.75rem] leading-relaxed text-ink-400">
            Provisional - may shift on the day.
          </p>
          <Link href="/programme" className="link-sweep self-start text-[0.875rem] text-ink-900 sm:self-auto">
            Full programme
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
