"use client";

/**
 * Factual numeral.
 * Previously counted up on entry; in the flat editorial direction figures are
 * printed plainly - a number that animates reads as dashboard decoration, not
 * as a statement. The API is unchanged so all call sites keep working.
 */
/** Years and small counts read as numbers, not as financial figures. */
function grouped(value: number, decimals: number): string {
  const fixed = value.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return value >= 1900 && value <= 2100 && decimals === 0 ? String(value) : fixed;
}

export function CountUp({
  value,
  suffix = "",
  prefix = "",
  className = "",
  decimals = 0,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}) {
  return (
    <span className={className}>
      {prefix}
      {grouped(value, decimals)}
      {suffix}
    </span>
  );
}
