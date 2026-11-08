import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { BrandBG } from "@/components/brand/BrandBG";

type Family = "green" | "multicolor" | "red" | "pink" | "blue";

/**
 * Interior page header.
 * ------------------------------------------------------------------
 * Editorial headers are typographic: white ground, ink display type, a tracked
 * label, an optional lead and a ruled metadata line. The brand asset appears
 * once, as a full-bleed colour strip beneath the header - the flyers' colour
 * bar - rather than as a background that has to be darkened before white type
 * can sit on it. Result: maximum type contrast and the supplied artwork shown
 * at full fidelity, on every page.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  meta = [],
  actions,
  family = "multicolor",
  strip = true,
  priority = false,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string | React.ReactNode;
  meta?: { label: string; value: string }[];
  actions?: React.ReactNode;
  family?: Family;
  strip?: boolean;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header className="bg-white">
      <div className="shell-wide pb-10 pt-24 lg:pb-14 lg:pt-32">
        {eyebrow && (
          <Reveal duration={400}>
            <p className="label-xs text-ink-400">{eyebrow}</p>
          </Reveal>
        )}

        <SplitText
          as="h1"
          text={title}
          trigger="mount"
          step={46}
          className="mt-4 block max-w-5xl font-display text-display-lg text-ink-900"
        />

        {lead && (
          <Reveal delay={140} duration={500}>
            <div className="mt-5 max-w-2xl text-[1rem] leading-relaxed text-ink-600">{lead}</div>
          </Reveal>
        )}

        {actions && <Reveal delay={200} duration={500}>{actions}</Reveal>}

        {meta.length > 0 && (
          <dl className="mt-9 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {meta.map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-[0.75rem] text-ink-400">{item.label}</dt>
                <dd className="mt-1 text-[0.875rem] font-medium leading-snug text-ink-800">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {children}
      </div>

      {strip && (
        <BrandBG
          family={family}
          overlay
          priority={priority}
          className="h-[clamp(96px,12vw,168px)] w-full"
        >
          <span className="sr-only">Ephphata brand artwork</span>
        </BrandBG>
      )}
    </header>
  );
}
