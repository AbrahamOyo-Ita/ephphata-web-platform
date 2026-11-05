import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

/**
 * Factual figures only, printed flat.
 * Where a figure is a demonstration value it is explicitly labelled so it is
 * never mistaken for a real outcome. Numbers no longer count up - they are
 * statements, not animation.
 */
export function StatsStrip({
  stats,
  tone = "dark",
}: {
  stats: { value: number; suffix?: string; label: string; note?: string }[];
  tone?: "dark" | "light";
}) {
  const light = tone === "light";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Reveal key={stat.label} delay={i * 60} duration={380}>
          <div className="border-t border-current/20 py-5 pr-5 sm:py-6 lg:pr-6">
            <div
              className={`font-display text-[clamp(1.75rem,3.6vw,2.9rem)] leading-none tabular-nums ${
                light ? "text-white" : "text-ink-900"
              }`}
            >
              <CountUp value={stat.value} suffix={stat.suffix} />
            </div>
            <p
              className={`mt-2 text-[0.8125rem] font-medium ${light ? "text-white/80" : "text-ink-600"}`}
            >
              {stat.label}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
