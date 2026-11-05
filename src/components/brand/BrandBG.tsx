/**
 * Branded surface.
 * ------------------------------------------------------------------
 * The five supplied assets are the identity of this site, so they are used as
 * FULL backgrounds - type sits on the artwork, not beside it. Legibility comes
 * from a soft tonal wash in the artwork's own hue family, not from a grey slab:
 * the wash is a deep blend of the same colours, so the pattern still reads and
 * the artwork never has to be flattened into a colour block.
 */
type Family = "green" | "multicolor" | "red" | "pink" | "blue";

const SIZES = [900, 1600, 2560] as const;

/**
 * Tonal wash per family: a blend of that asset's own hues.
 *  - `flat`  - for small strips where a single tone is cleaner
 *  - `wash`  - full-bleed sections; deep at the reading edge, near-clear at the far edge
 */
export const BRAND_TONE: Record<
  Family,
  { flat: string; wash: string; edge: string }
> = {
  green: {
    flat: "#003238",
    edge: "#00544F",
    wash:
      "linear-gradient(105deg, rgba(0,34,30,0.90) 0%, rgba(0,46,44,0.78) 34%, rgba(0,70,64,0.60) 66%, rgba(0,90,80,0.34) 100%)",
  },
  multicolor: {
    flat: "#1C003A",
    edge: "#3B0A5C",
    wash:
      "linear-gradient(105deg, rgba(20,0,38,0.90) 0%, rgba(38,0,66,0.76) 34%, rgba(78,12,96,0.56) 68%, rgba(120,30,116,0.22) 100%)",
  },
  red: {
    flat: "#60000B",
    edge: "#8A0016",
    wash:
      "linear-gradient(105deg, rgba(58,0,8,0.92) 0%, rgba(94,0,14,0.80) 34%, rgba(140,6,26,0.64) 68%, rgba(190,20,40,0.52) 100%)",
  },
  pink: {
    flat: "#1F003A",
    edge: "#45006B",
    wash:
      "linear-gradient(105deg, rgba(24,0,42,0.90) 0%, rgba(48,0,74,0.78) 34%, rgba(92,2,116,0.60) 68%, rgba(140,10,150,0.36) 100%)",
  },
  blue: {
    flat: "#050845",
    edge: "#0A1C6B",
    wash:
      "linear-gradient(105deg, rgba(4,6,50,0.92) 0%, rgba(6,16,76,0.80) 34%, rgba(8,46,130,0.66) 68%, rgba(8,110,190,0.54) 100%)",
  },
};

/** @deprecated kept so existing imports keep compiling - use BRAND_TONE. */
export const DEEP_TONE: Record<Family, string> = {
  green: "bg-[#003238]",
  multicolor: "bg-[#1C003A]",
  red: "bg-[#60000B]",
  pink: "bg-[#1F003A]",
  blue: "bg-[#050845]",
};

export function BrandBG({
  family,
  overlay = false,
  priority = false,
  className = "",
  overlayClassName = "",
  children,
}: {
  family: Family;
  /** `true` = apply the tonal wash (needed whenever white type sits on the art) */
  overlay?: boolean;
  priority?: boolean;
  className?: string;
  overlayClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <picture>
        <source
          type="image/avif"
          srcSet={SIZES.map((w) => `/brand/bg/${family}-${w}.avif ${w}w`).join(", ")}
          sizes="100vw"
        />
        <source
          type="image/webp"
          srcSet={SIZES.map((w) => `/brand/bg/${family}-${w}.webp ${w}w`).join(", ")}
          sizes="100vw"
        />
        <img
          src={`/brand/bg/${family}-1600.jpg`}
          alt=""
          aria-hidden="true"
          width={3840}
          height={2160}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center" }}
        />
      </picture>

      {overlay && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${overlayClassName}`}
          style={{ background: BRAND_TONE[family].wash }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Flyer artwork with an aspect-ratio lock so nothing is ever squashed.
 * Framing is square-cornered - the flyers place photography as hard rectangles.
 */
export function Flyer({
  slug,
  alt,
  ratio = "4 / 5",
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 40vw",
}: {
  slug: string;
  alt: string;
  ratio?: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: ratio }}>
      <picture>
        <source type="image/avif" srcSet={`/brand/flyers/${slug}.avif`} sizes={sizes} />
        <source type="image/webp" srcSet={`/brand/flyers/${slug}.webp`} sizes={sizes} />
        <img
          src={`/brand/flyers/${slug}.jpg`}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>
    </div>
  );
}
