import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon, Play, ArrowUpRight } from "lucide-react";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { Flyer } from "@/components/brand/BrandBG";
import { listGalleries, listTestimonials } from "@/lib/data/content";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media & gallery",
  description: "Photography, film and recaps from previous EphaPhata editions.",
};

const FLYER_FALLBACKS = [
  "festival-lineup",
  "its-today",
  "four-days",
  "three-days",
  "festival-multicolor",
  "festival-emerald",
];

export default function MediaPage() {
  const galleries = listGalleries(true);
  const testimonials = listTestimonials(true);

  const mediaByGallery = new Map<string, { id: string; url: string; alt: string | null }[]>();
  for (const g of galleries) {
    mediaByGallery.set(
      g.id,
      db
        .prepare("SELECT id, url, alt FROM media_assets WHERE gallery_id = ? ORDER BY sort_order")
        .all(g.id) as { id: string; url: string; alt: string | null }[]
    );
  }

  return (
    <>
      <section className="bg-white pb-12 pt-24 lg:pb-16 lg:pt-32">
        <div className="shell-wide">
          <Reveal variant="fade">
            <div className="flex items-center gap-3">
              <span className="h-[2px] w-8 rounded-xs bg-ink-900" />
              <p className="eyebrow text-ink-600">Media</p>
            </div>
          </Reveal>

          <SplitText
            as="h1"
            text="MEMORIES & MOMENTS"
            className="mt-6 block font-display text-display-lg text-ink-900"
            step={56}
            trigger="mount"
          />

          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-body-lg leading-relaxed text-ink-600">
              Approved photography and film from previous editions. Nothing is published here
              without the media team&apos;s sign-off.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-section">
        <div className="shell-wide">
          {galleries.length === 0 ? (
            <div className="rounded-md border border-dashed border-ink-900/20 bg-paper-50 p-14 text-center">
              <ImageIcon className="mx-auto h-6 w-6 text-ink-300" strokeWidth={1.6} />
              <p className="mt-4 font-display text-lg uppercase tracking-wide text-ink-700">
                Gallery coming soon
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[0.875rem] leading-relaxed text-ink-500">
                Approved imagery will appear here once the media team has published it.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {galleries.map((gallery, gi) => {
                const items = mediaByGallery.get(gallery.id) ?? [];
                const isPlaceholder = items.some((m) => m.alt?.startsWith("PLACEHOLDER"));
                return (
                  <Reveal key={gallery.id} delay={gi * 90}>
                    <article className="group overflow-hidden rounded-md border border-ink-900/[0.08] bg-white">
                      <div className="relative overflow-hidden">
                        <Flyer
                          slug={gallery.cover_url?.match(/([a-z0-9-]+)\.webp/)?.[1] ?? "festival-lineup"}
                          alt={gallery.title}
                          ratio="16 / 10"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="transition-transform duration-700 ease-brand group-]"
                        />
                        <div className="absolute inset-0 bg-ink-900/45" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <span className="badge bg-white/20 text-white">
                            {gallery.category?.replace(/-/g, " ") ?? "Gallery"}
                          </span>
                          <h2 className="mt-2 font-display text-xl uppercase tracking-wide text-white">
                            {gallery.title}
                          </h2>
                          <p className="mt-1 text-[0.75rem] text-white/65">
                            {gallery.item_count} items
                            {gallery.event_title && ` · ${gallery.event_title}`}
                          </p>
                        </div>
                      </div>

                      {/* Thumbnails */}
                      <div className="grid grid-cols-4 gap-0.5 bg-ink-900/[0.04] p-0.5">
                        {FLYER_FALLBACKS.slice(0, 4).map((slug) => (
                          <Flyer
                            key={slug}
                            slug={slug}
                            alt=""
                            ratio="1 / 1"
                            sizes="120px"
                            className="opacity-90 transition-opacity hover:opacity-100"
                          />
                        ))}
                      </div>

                      {isPlaceholder && (
                        <p className="border-t border-ink-900/[0.07] px-5 py-3 text-[0.6875rem] leading-relaxed text-ink-400">
                          Placeholder tiles - awaiting approved photography from the media team.
                        </p>
                      )}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}

          {/* Video section - honest empty state */}
          <Reveal delay={160}>
            <div className="mt-6 rounded-md border border-ink-900/[0.08] bg-paper-50 p-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xs bg-ink-900 text-white">
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg uppercase tracking-wide text-ink-900">
                      Film & recaps
                    </h2>
                    <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-ink-500">
                      Video recaps are published to our official channels first. A video ID must be
                      configured in the dashboard before anything is embedded here - we don&apos;t
                      show an empty player pretending to work.
                    </p>
                  </div>
                </div>
                <Link href="/contact" className="btn-outline btn-sm shrink-0">
                  Request media access
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Testimonies */}
          {testimonials.length > 0 && (
            <div className="mt-16">
              <Reveal variant="fade">
                <p className="eyebrow text-ink-400">Testimonies</p>
                <h2 className="mt-3 font-display text-display-sm uppercase text-ink-900">
                  STORIES FROM THE HALL
                </h2>
              </Reveal>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((t, i) => (
                  <Reveal key={t.id} delay={i * 80}>
                    <blockquote className="h-full rounded-md border border-ink-900/[0.08] bg-white p-6">
                      <p className="font-editorial text-[1.05rem] italic leading-snug text-ink-800">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <footer className="mt-4 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                        {t.author_name}
                      </footer>
                    </blockquote>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
