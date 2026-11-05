import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * robots.txt - the admin app and per-attendee pages must never be indexed.
 */
export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/register/success", "/c/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
