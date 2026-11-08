import type { Metadata } from "next";
import { SplitText } from "@/components/motion/SplitText";
import { BrandBG } from "@/components/brand/BrandBG";
import { Reveal } from "@/components/motion/Reveal";
import { PrayerForm } from "@/components/public/PrayerForm";
import { Lock, EyeOff, HeartHandshake, ShieldCheck } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Prayer request",
  description:
    "Submit a private prayer request to the Ephphata prayer team. Anonymous submissions welcome.",
};

export default function PrayerPage() {
  return (
    <section className="bg-white pb-20 pt-24 lg:pt-32">
      <div className="shell-wide">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          {/* Left: framing + privacy */}
          <div>
            <Reveal variant="fade">
              <p className="label-xs text-ink-400">Prayer</p>
            </Reveal>

            <SplitText
              as="h1"
              text="LET US PRAY WITH YOU"
              className="mt-5 block font-display text-display-md text-ink-900"
              step={52}
              trigger="mount"
            />

            <Reveal delay={180}>
              <p className="mt-6 max-w-md text-body-lg leading-relaxed text-ink-600">
                You don&apos;t have to explain everything perfectly. Tell us what is on your heart,
                and the prayer team will stand with you.
              </p>
            </Reveal>

            <div className="mt-9 space-y-5 border-t border-ink-900/10 pt-8">
              {[
                {
                  icon: EyeOff,
                  title: "Anonymous by default",
                  body: "You can leave your name off entirely. We will still pray.",
                },
                {
                  icon: Lock,
                  title: "Never published",
                  body: "Requests are visible only to the authorised prayer team. They never appear on this website.",
                },
                {
                  icon: HeartHandshake,
                  title: "Follow-up is your choice",
                  body: "If you'd like someone to reach out, say so. Otherwise we simply pray.",
                },
                {
                  icon: ShieldCheck,
                  title: "Handled with care",
                  body: "Access is role-restricted at the database level and every access is audited.",
                },
              ].map(({ icon: Icon, title, body }, i) => (
                <Reveal key={title} delay={180 + i * 70}>
                  <div className="flex gap-3.5">
                    <span className="mt-0.5 shrink-0 text-ink-500">
                      <Icon className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <div>
                      <p className="text-[0.875rem] font-semibold text-ink-900">{title}</p>
                      <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-600">{body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={460}>
              <blockquote className="mt-10 rounded-md border border-ink-900/[0.08] bg-paper-50 p-5">
                <p className="font-editorial text-[1.05rem] italic leading-snug text-ink-800">
                  &ldquo;Cast all your anxiety on him because he cares for you.&rdquo;
                </p>
                <footer className="mt-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  1 Peter 5:7
                </footer>
              </blockquote>
            </Reveal>
          </div>

          {/* Right: form */}
          <Reveal delay={120} variant="right">
            <div className="border-t-2 border-ink-900 pt-6 sm:pt-8">
              <PrayerForm />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Brand colour strip closes the page - artwork at full fidelity */}
      <BrandBG family="pink" overlay className="mt-16">
        <div className="shell-wide py-12 lg:py-14">
          <p className="font-editorial text-[clamp(1.2rem,2.4vw,1.8rem)] italic text-white">
            &ldquo;Cast all your anxiety on him because he cares for you.&rdquo;
          </p>
          <p className="mt-2 label-xs text-white/60">1 Peter 5:7</p>
        </div>
      </BrandBG>
    </section>
  );
}
