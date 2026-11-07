import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

/**
 * Typography
 * ------------------------------------------------------------------
 * Chosen by comparing letterforms against the supplied flyers:
 *  - Anton        → the heavy, tightly-set uppercase of "THREE DAYS" /
 *                   "FOUR DAYS" / "UNICAL". Condensed, high-impact display.
 *  - Bodoni Moda  → the high-contrast serif of the large "FESTIVAL" treatments.
 *  - Inter        → neutral UI/body face for forms, tables and dashboards.
 *  - Caveat       → the handwritten "with" / "To Go" accent in the flyers.
 * All are self-hosted through next/font (no runtime CDN request).
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "EphaPhata - One gathering. One purpose.",
    template: "%s · EphaPhata",
  },
  description: site.description,
  openGraph: {
    title: "EphaPhata with OT Power & The Attackers",
    description: site.description,
    type: "website",
    siteName: "EphaPhata",
    images: [{ url: "/brand/flyers/unical-lineup.webp", width: 864, height: 1080, alt: "EphaPhata Unical 2026" }],
  },
  twitter: { card: "summary_large_image", title: "EphaPhata", description: site.description },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* Progressive enhancement: reveal animations only engage when JS is on,
            so content is never hidden for crawlers or no-JS visitors. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
