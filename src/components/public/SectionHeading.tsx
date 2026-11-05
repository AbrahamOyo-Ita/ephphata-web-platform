import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";

/**
 * Editorial section heading.
 * ------------------------------------------------------------------
 * Typography does the work: a small tracked label, then a large condensed
 * headline, then an optional high-contrast serif accent - the flyers' single
 * decorative device. No rules-with-dots, no invented decoration.
 */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  accentAfter,
  description,
  align = "left",
  tone = "dark",
  className = "",
  titleClassName = "",
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  accentAfter?: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
  titleClassName?: string;
}) {
  const light = tone === "light";

  return (
    <div
      className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-4xl"} ${className}`}
    >
      {eyebrow && (
        <Reveal duration={400}>
          <p className={`label-xs ${light ? "text-white/70" : "text-ink-400"}`}>{eyebrow}</p>
        </Reveal>
      )}

      <SplitText
        as="h2"
        text={title}
        className={`mt-4 block font-display text-display-md leading-[1.06] ${light ? "text-white" : "text-ink-900"} ${titleClassName}`}
        step={40}
      />

      {(accent || accentAfter) && (
        <p
          className={`mt-1 font-editorial text-[clamp(1.6rem,4vw,3rem)] italic leading-[1.1] ${
            light ? "text-white/90" : "text-ink-600"
          }`}
        >
          {accent}
          {accentAfter && (
            <span
              className={`ml-3 font-sans text-[0.42em] font-semibold uppercase not-italic tracking-[0.14em] ${
                light ? "text-white/60" : "text-ink-400"
              }`}
            >
              {accentAfter}
            </span>
          )}
        </p>
      )}

      {description && (
        <p
          className={`mt-5 max-w-2xl text-[1rem] leading-relaxed ${
            align === "center" ? "mx-auto" : ""
          } ${light ? "text-white/75" : "text-ink-600"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
