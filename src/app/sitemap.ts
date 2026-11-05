import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { listEvents } from "@/lib/data/events";

/**
 * Sitemap. Admin routes are excluded by design (they are noindex and require
 * auth), as is the registration success page (personal, per-attendee).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/events`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/volunteer`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/prayer`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/media`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/programme`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    eventRoutes = listEvents().flatMap((e) => {
      const updated = e.updated_at ? new Date(e.updated_at) : now;
      const entries: MetadataRoute.Sitemap = [
        {
          url: `${base}/events/${e.slug}`,
          lastModified: Number.isNaN(updated.getTime()) ? now : updated,
          changeFrequency: "weekly",
          priority: 0.9,
        },
      ];
      // Only advertise the registration page while it actually accepts entries.
      if (e.status === "published" && e.registration_open === 1) {
        entries.push({
          url: `${base}/events/${e.slug}/register`,
          lastModified: Number.isNaN(updated.getTime()) ? now : updated,
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
      return entries;
    });
  } catch {
    // A database hiccup must not take the sitemap down entirely.
    eventRoutes = [];
  }

  return [...staticRoutes, ...eventRoutes];
}
