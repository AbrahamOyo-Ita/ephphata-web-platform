import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { CountUp } from "@/components/motion/CountUp";

/**
 * Metric accents.
 * Restrained by design: the icon carries a small amount of brand colour, the
 * figure stays ink. No tinted panels, no coloured chart backgrounds, no glow.
 */
const ACCENTS = {
  violet: "text-violet-700",
  emerald: "text-emerald-700",
  azure: "text-azure-700",
  magenta: "text-magenta-700",
  flame: "text-flame-600",
} as const;

export function MetricCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  progress,
  href,
  accent = "violet",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  delta?: number;
  hint?: string;
  progress?: number;
  href?: string;
  accent?: keyof typeof ACCENTS;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
          {label}
        </p>
        <span className={`-mt-0.5 shrink-0 ${ACCENTS[accent]}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-[1.75rem] font-semibold leading-none tabular-nums tracking-[-0.02em] text-ink-900">
          <CountUp value={value} />
        </span>
        {typeof delta === "number" && delta !== 0 && (
          <span
            className={`mb-1 inline-flex items-center gap-0.5 rounded-xs px-1.5 py-0.5 text-[0.625rem] font-bold ${
              delta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-flame-50 text-flame-600"
            }`}
          >
            {delta > 0 ? (
              <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={3} />
            ) : (
              <ArrowDownRight className="h-2.5 w-2.5" strokeWidth={3} />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {delta === 0 && (
          <span className="mb-1 inline-flex items-center gap-0.5 rounded-xs bg-ink-900/5 px-1.5 py-0.5 text-[0.625rem] font-bold text-ink-400">
            <Minus className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-xs bg-ink-900/[0.07]">
          <div
            className="h-full bg-emerald-600"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}

      {hint && <p className="mt-2 text-[0.6875rem] text-ink-400">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-sm border border-ink-900/[0.08] bg-white p-4 transition-colors duration-300 hover:border-ink-900/15"
      >
        {inner}
      </Link>
    );
  }

  return <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">{inner}</div>;
}
