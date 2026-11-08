import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Clock, MessageSquare, ArrowUpRight } from "lucide-react";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { BrandBG } from "@/components/brand/BrandBG";
import { ContactForm } from "@/components/public/ContactForm";
import { InstagramIcon, YoutubeIcon, TiktokIcon } from "@/components/brand/SocialIcons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Ephphata organising team.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-white pb-12 pt-24 lg:pb-16 lg:pt-32">
        <div className="shell-wide">
          <Reveal variant="fade">
            <div className="flex items-center gap-3">
              <span className="h-[2px] w-8 rounded-xs bg-ink-900" />
              <p className="eyebrow text-ink-600">Contact</p>
            </div>
          </Reveal>

          <SplitText
            as="h1"
            text="TALK TO THE TEAM"
            className="mt-6 block font-display text-display-lg text-ink-900"
            step={58}
            trigger="mount"
          />

          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-body-lg leading-relaxed text-ink-600">
              Event questions, partnership enquiries, media requests or volunteering - send it
              here and it reaches the right desk.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-section">
        <div className="shell-wide">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <Reveal className="min-w-0">
              <div className="rounded-xs border border-ink-900/[0.08] bg-white p-6 sm:p-8">
                <ContactForm />
              </div>
            </Reveal>

            <Reveal delay={140} variant="right" className="min-w-0">
              <div className="space-y-4">
                <div className="rounded-md border border-ink-900/[0.08] bg-paper-50 p-5">
                  <p className="eyebrow text-ink-400">Direct</p>
                  <div className="mt-4 space-y-3.5">
                    <a
                      href={`mailto:${site.email}`}
                      className="flex items-start gap-3 text-[0.875rem] text-ink-800 transition-colors hover:text-ink-900 hover:underline"
                    >
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.9} />
                      <span>
                        <span className="block font-semibold">Email</span>
                        <span className="text-[0.8125rem] text-ink-600">{site.email}</span>
                      </span>
                    </a>
                    <div className="flex items-start gap-3 text-[0.875rem] text-ink-800">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.9} />
                      <span>
                        <span className="block font-semibold">Based in</span>
                        <span className="text-[0.8125rem] text-ink-600">
                          Calabar, Cross River State, Nigeria
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-[0.875rem] text-ink-800">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.9} />
                      <span>
                        <span className="block font-semibold">Response time</span>
                        <span className="text-[0.8125rem] text-ink-600">
                          Within two working days
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-ink-900/[0.08] bg-white p-5">
                  <p className="eyebrow text-ink-400">Follow</p>
                  <div className="mt-4 flex gap-2">
                    {[
                      { href: site.social.instagram, Icon: InstagramIcon, label: "Instagram" },
                      { href: site.social.tiktok, Icon: TiktokIcon, label: "TikTok" },
                      { href: site.social.youtube, Icon: YoutubeIcon, label: "YouTube" },
                    ].map(({ href, Icon, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="grid h-10 w-10 place-items-center rounded-xs border border-ink-900/15 text-ink-600 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                  <p className="mt-4 text-[0.6875rem] leading-relaxed text-ink-400">
                    Official announcements are published here and on our social channels only.
                    Treat anything else as unconfirmed.
                  </p>
                </div>

                <div className="rounded-md border border-violet-600/15 bg-violet-50 p-5">
                  <MessageSquare className="h-4 w-4 text-ink-500" strokeWidth={2} />
                  <p className="mt-2.5 text-[0.8125rem] font-semibold text-ink-900">
                    Prayer requests go elsewhere
                  </p>
                  <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-600">
                    They are handled privately by the prayer team.{" "}
                    <a href="/prayer" className="font-semibold text-violet-700 underline underline-offset-2">
                      Submit a prayer request
                    </a>
                    .
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Full-bleed red asset carrying the three routes */}
      <section className="text-white">
        <BrandBG family="red" overlay>
          <div className="shell-wide grid sm:grid-cols-3">
            {[
              { label: "Event enquiries", href: "/events" },
              { label: "Volunteer with us", href: "/volunteer" },
              { label: "Read the FAQs", href: "/faq" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center justify-between gap-4 border-b border-white/20 py-5 transition-colors hover:bg-white/[0.06] sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0 sm:first:pl-0"
              >
                <span className="font-display text-[0.9375rem] uppercase tracking-wide">
                  {item.label}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </div>
        </BrandBG>
      </section>
    </>
  );
}
