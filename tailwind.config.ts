import type { Config } from "tailwindcss";

/**
 * EPHAPHATA DESIGN TOKENS
 * ---------------------------------------------------------------
 * Every colour below is sampled directly from the supplied 4K
 * background assets (see scripts/build-assets.mjs + design/TOKENS.md).
 * No invented brand colours.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Neutral reading surfaces — the dominant layer of the site
        ink: {
          900: "#111111", // primary text
          800: "#242424", // charcoal
          700: "#3D3D3D",
          600: "#5C5C5C", // secondary text
          400: "#8A8A8A",
          300: "#B9B9B9",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          50: "#FBFBF9", // warm off-white
          100: "#F5F4F0",
          200: "#ECEAE4",
          300: "#DFDCD3",
        },

        // Brand families — extracted, not invented
        emerald: {
          50: "#E6FBF4",
          100: "#C2F5E5",
          300: "#4FDDB6",
          500: "#02C58A", // sampled: green bg top-left
          600: "#01A978",
          700: "#01805C",
          900: "#003238", // sampled: green bg bottom
        },
        flame: {
          50: "#FFEBEE",
          100: "#FFD3D9",
          500: "#FE1430", // sampled: red bg
          600: "#E51C22", // sampled: multicolor red
          900: "#60000B", // sampled: red bg bottom
        },
        azure: {
          300: "#7FD8FB",
          500: "#08B1F2", // sampled: blue bg top-left
          600: "#0683D2",
          900: "#050845", // sampled: blue bg bottom
          950: "#050628",
        },
        violet: {
          400: "#B47CF5",
          500: "#8B3FF0",
          600: "#7A2BD9",
          800: "#3D0E6B",
          900: "#250043", // sampled: multicolor deep
          950: "#1C003A", // sampled: pink bg bottom
        },
        magenta: {
          300: "#E485DF", // sampled: multicolor pink
          500: "#D803E5", // sampled: pink bg
          600: "#EB06F0",
          700: "#B502C9",
        },
        gold: {
          300: "#FFD98A",
          400: "#FEB143", // sampled: multicolor amber
          500: "#F5C518", // flyer yellow block
          600: "#E0A800",
          700: "#8A6100", // text-safe amber (5.5:1 on white, meets WCAG AA)
        },

        // Semantic
        success: "#01A978",
        warning: "#E0A800",
        danger: "#DC2A3C",
        info: "#0683D2",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        editorial: ["var(--font-editorial)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Editorial display scale, fluid via clamp
        "display-xl": ["clamp(3.2rem, 10vw, 8rem)", { lineHeight: "1.0", letterSpacing: "-0.015em" }],
        "display-lg": ["clamp(2.6rem, 7.2vw, 5.6rem)", { lineHeight: "1.02", letterSpacing: "-0.012em" }],
        "display-md": ["clamp(2.1rem, 5vw, 3.9rem)", { lineHeight: "1.04", letterSpacing: "-0.01em" }],
        "display-sm": ["clamp(1.7rem, 3.4vw, 2.6rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        "editorial-xl": ["clamp(3rem, 12vw, 10rem)", { lineHeight: "0.8", letterSpacing: "0.01em" }],
        "eyebrow": ["0.6875rem", { lineHeight: "1", letterSpacing: "0.22em" }],
        "body-lg": ["clamp(1rem, 1.15vw, 1.125rem)", { lineHeight: "1.65" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
        34: "8.5rem",
        section: "clamp(3.5rem, 6.5vw, 6.5rem)",
      },
      // FLAT SYSTEM — the flyers have no rounded corners except photography.
      // Nothing above 8px is available, which prevents pills and blobs by construction.
      borderRadius: {
        none: "0",
        xs: "2px",
        sm: "3px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
        full: "2px", // deliberate: `rounded-full` now reads as a flat chip, not a pill
      },
      // FLAT SYSTEM — all elevation removed. Separation is achieved with hairline
      // borders and whitespace. These keys are kept (mapped to `none`) so any
      // remaining reference degrades silently instead of rendering a shadow.
      boxShadow: {
        none: "none",
        card: "none",
        lift: "none",
        inset: "none",
        glow: "none",
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
      },
      maxWidth: {
        shell: "1320px",
        prose: "68ch",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(0.22, 1, 0.36, 1)",
        snap: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      // FLAT SYSTEM — no continuous or decorative motion. Only functional
      // transitions remain (colour, opacity, accordion height).
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translate3d(0,10px,0)" },
          "100%": { opacity: "1", transform: "translate3d(0,0,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in .3s ease-out both",
        "slide-in": "slide-in .28s cubic-bezier(.22,1,.36,1) both",
        // legacy names neutralised so no continuous motion can survive
        marquee: "none",
        "marquee-fast": "none",
        "pulse-ring": "none",
        shimmer: "none",
        "fade-up": "fade-in .3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
