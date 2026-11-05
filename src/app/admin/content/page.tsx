import Link from "next/link";
import { FileText, ExternalLink, Quote, Image as ImageIcon, Megaphone, Eye } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AnnouncementComposer } from "@/components/admin/AnnouncementComposer";
import { listContentPages, listTestimonials, listGalleries, listAnnouncements } from "@/lib/data/content";
import { formatRelative } from "@/lib/format";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { DemoBanner } from "@/components/admin/DemoBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content" };

export default async function ContentPage() {
  const user = await requireUser("content.view");
  const pages = listContentPages();
  const testimonials = listTestimonials(false);
  const galleries = listGalleries(false);
  const announcements = listAnnouncements(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">Content</p>
        <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
          Website content
        </h1>
        <p className="mt-1 text-[0.8125rem] text-ink-500">
          Pages, testimonials, galleries and announcements
        </p>
        </div>
        <div className="flex items-center gap-2">
          <AnnouncementComposer canManage={can(user.role, "content.manage")} />
          <DemoBanner compact />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Pages */}
        <section className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
          <header className="flex items-center justify-between border-b border-ink-900/[0.07] px-4 py-3">
            <div>
              <h2 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
                <FileText className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
                Pages
              </h2>
              <p className="text-[0.625rem] text-ink-400">Public site copy, editable without a deploy</p>
            </div>
          </header>
          <ul className="divide-y divide-ink-900/[0.05]">
            {pages.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-ink-900">{p.title}</p>
                  <p className="truncate font-mono text-[0.625rem] text-ink-400">/{p.slug}</p>
                </div>
                <StatusBadge tone={STATUS_TONES[p.status] ?? "neutral"} label={STATUS_LABELS[p.status] ?? p.status} />
                <Link
                  href={p.slug === "home" ? "/" : `/${p.slug}`}
                  target="_blank"
                  rel="noopener"
                  aria-label={`View ${p.title}`}
                  className="rounded p-1 text-ink-400 hover:bg-paper-50 hover:text-ink-900"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
            {pages.length === 0 && (
              <li className="px-4 py-8 text-center text-[0.75rem] text-ink-400">No managed pages yet.</li>
            )}
          </ul>
          <footer className="border-t border-ink-900/[0.07] bg-paper-50/60 px-4 py-2.5">
            <p className="text-[0.625rem] leading-relaxed text-ink-400">
              Page bodies are served from the database when a row exists; otherwise the built-in copy
              is used. This keeps the site resilient if the CMS is unavailable.
            </p>
          </footer>
        </section>

        {/* Testimonials */}
        <section className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
          <header className="border-b border-ink-900/[0.07] px-4 py-3">
            <h2 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
              <Quote className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
              Testimonials
            </h2>
            <p className="text-[0.625rem] text-ink-400">
              {testimonials.filter((t) => t.status === "approved").length} approved · only approved quotes appear publicly
            </p>
          </header>
          <ul className="divide-y divide-ink-900/[0.05]">
            {testimonials.slice(0, 6).map((t) => (
              <li key={t.id} className="px-4 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 flex-1 text-[0.75rem] leading-relaxed text-ink-700">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <StatusBadge
                    tone={t.status === "approved" ? "emerald" : "amber"}
                    label={t.status === "approved" ? "Approved" : "Pending"}
                  />
                </div>
                <p className="mt-1 text-[0.625rem] text-ink-400">
                  {t.author_name} · {formatRelative(t.created_at)}
                </p>
              </li>
            ))}
            {testimonials.length === 0 && (
              <li className="px-4 py-8 text-center text-[0.75rem] text-ink-400">No testimonials submitted.</li>
            )}
          </ul>
        </section>

        {/* Galleries */}
        <section className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
          <header className="border-b border-ink-900/[0.07] px-4 py-3">
            <h2 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
              <ImageIcon className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
              Galleries
            </h2>
            <p className="text-[0.625rem] text-ink-400">Photo collections for the media page</p>
          </header>
          <ul className="divide-y divide-ink-900/[0.05]">
            {galleries.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] font-medium text-ink-900">{g.title}</p>
                  <p className="text-[0.625rem] text-ink-400">
                    {g.category ?? "General"} · {g.item_count} items
                  </p>
                </div>
                <StatusBadge tone={g.status === "published" ? "emerald" : "neutral"} label={g.status === "published" ? "Published" : "Draft"} />
              </li>
            ))}
            {galleries.length === 0 && (
              <li className="px-4 py-8 text-center text-[0.75rem] text-ink-400">
                No galleries yet. Photography from past editions is added here - placeholders are
                used until real images are supplied.
              </li>
            )}
          </ul>
        </section>

        {/* Announcements */}
        <section className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
          <header className="border-b border-ink-900/[0.07] px-4 py-3">
            <h2 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
              <Megaphone className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
              Announcements &amp; enquiries
            </h2>
            <p className="text-[0.625rem] text-ink-400">Site banners, plus contact-form messages</p>
          </header>
          <ul className="divide-y divide-ink-900/[0.05]">
            {announcements.slice(0, 8).map((a) => (
              <li key={a.id} className="px-4 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-[0.8125rem] font-medium text-ink-900">{a.title}</p>
                  <StatusBadge tone={a.is_published ? "emerald" : "amber"} label={a.is_published ? "Published" : "Draft"} />
                </div>
                <p className="mt-0.5 line-clamp-1 text-[0.6875rem] text-ink-500">{a.body}</p>
                <p className="mt-0.5 text-[0.625rem] text-ink-400">{formatRelative(a.created_at)}</p>
              </li>
            ))}
            {announcements.length === 0 && (
              <li className="px-4 py-8 text-center text-[0.75rem] text-ink-400">Nothing here yet.</li>
            )}
          </ul>
          <footer className="flex items-center gap-1.5 border-t border-ink-900/[0.07] bg-paper-50/60 px-4 py-2.5">
            <Eye className="h-3 w-3 text-ink-400" />
            <p className="text-[0.625rem] leading-relaxed text-ink-400">
              Contact-form enquiries are stored as unpublished rows so no message is ever lost.
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
}
