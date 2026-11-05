/**
 * Editorial band.
 * ------------------------------------------------------------------
 * Still, ruled strip of phrases - a flyer's metadata line, not a marquee.
 * It must never wrap onto a second line: on narrow screens the surplus phrases
 * drop out instead of stacking, and the row clips rather than scrolls.
 */
export function MarqueeBand({
  phrases,
  variant = "dark",
}: {
  phrases: string[];
  variant?: "dark" | "light";
  speed?: number;
}) {
  const dark = variant === "dark";
  const shown = phrases.slice(0, 6);

  return (
    <div
      className={`overflow-hidden border-y ${
        dark
          ? "border-white/10 bg-ink-900 text-white"
          : "border-ink-900/10 bg-paper-50 text-ink-900"
      }`}
    >
      <div className="shell-wide flex items-center justify-start gap-x-5 py-3.5 sm:justify-center sm:gap-x-7">
        {shown.map((phrase, i) => (
          <span
            key={`${phrase}-${i}`}
            // Only the first three survive on small phones - no wrap, no overflow.
            className={`${i < 3 ? "flex" : "hidden sm:flex"} shrink-0 items-center gap-5 sm:gap-7`}
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={`h-1 w-1 shrink-0 ${dark ? "bg-white/30" : "bg-ink-900/25"}`}
              />
            )}
            <span
              className={`whitespace-nowrap ${
                i % 2 === 0
                  ? "font-display text-[0.8125rem] uppercase tracking-[0.06em] sm:text-[0.9375rem]"
                  : "font-editorial text-[0.8125rem] italic sm:text-[0.9375rem]"
              }`}
            >
              {phrase}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
