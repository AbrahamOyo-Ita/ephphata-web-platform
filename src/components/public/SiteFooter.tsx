import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon, TiktokIcon } from "@/components/brand/SocialIcons";
import { footerNav, site } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

/**
 * Footer.
 * Solid ink ground rather than a darkened brand asset - the artwork is used in
 * the body where it can actually be seen, and the footer closes the page
 * quietly. Flat rules, no gradients, no arrow-on-hover animation.
 */
export function SiteFooter({ variant = "multicolor" }: { variant?: "multicolor" | "blue" | "pink" }) {
  void variant;

  return (
    <footer className="bg-ink-900 text-white">
      <div className="shell-wide pb-10 pt-16 lg:pt-20">
        {/* Newsletter */}
        <div className="grid gap-10 border-b border-white/15 pb-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p className="label-xs text-white/55">Stay close</p>
            <h2 className="mt-4 font-display text-display-sm uppercase text-white">
              DON&rsquo;T MISS THE NEXT ONE.
            </h2>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/70">
              One message when registration opens, one reminder before the gathering. Nothing else.
            </p>
          </div>
          <div className="lg:pt-6">
            <NewsletterForm />
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="font-display text-3xl tracking-wide text-white">
              EPHAPHATA
            </Link>
            <p className="mt-3 max-w-xs text-[0.8125rem] leading-relaxed text-white/60">
              A worship and spiritual gathering with {site.hostFull}. Hosted in Calabar, Cross River State.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {[
                { href: site.social.instagram, icon: InstagramIcon, label: "Instagram" },
                { href: site.social.youtube, icon: YoutubeIcon, label: "YouTube" },
                { href: site.social.tiktok, icon: TiktokIcon, label: "TikTok" },
                { href: site.social.facebook, icon: FacebookIcon, label: "Facebook" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-xs border border-white/25 text-white/75 transition-colors duration-150 hover:border-white hover:bg-white hover:text-ink-900"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="label-xs text-white/45">{group.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.8125rem] text-white/75 transition-colors duration-150 hover:text-white hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Baseline */}
        <div className="flex flex-col gap-4 border-t border-white/15 pt-8 text-[0.75rem] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EphaPhata. All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Calabar · Cross River State · Nigeria</span>
            <a
              href={site.social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-white/80"
            >
              @otesepower
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
