import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";

/**
 * Typography
 * ------------------------------------------------------------------
 * Chosen by comparing letterforms against the supplied flyers:
 * Casagrande Grind is supplied with the project and bundled locally, so the
 * typography is identical in development, CI, and production.
 */
const casagrandeWide = localFont({
  src: "../../CasagrandeGrind-Wide.woff2",
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const casagrandeRegular = localFont({
  src: "../../CasagrandeGrind-Regular.woff2",
  variable: "--font-sans",
  display: "swap",
  preload: true,
});
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
      className={`${casagrandeWide.variable} ${casagrandeRegular.variable}`}
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
