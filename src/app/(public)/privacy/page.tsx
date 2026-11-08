import type { Metadata } from "next";
import Link from "next/link";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { getContentPage } from "@/lib/data/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How Ephphata collects, uses and protects your information.",
};

export default function PrivacyPage() {
  const page = getContentPage("privacy");

  return (
    <section className="pt-32 pb-24 lg:pt-40">
      <div className="shell-wide">
        <div className="mx-auto max-w-2xl">
          <Reveal variant="fade">
            <p className="eyebrow text-ink-600">Legal</p>
          </Reveal>

          <SplitText
            as="h1"
            text="PRIVACY NOTICE"
            className="mt-5 block font-display text-display-md text-ink-900"
            step={54}
            trigger="mount"
          />

          <Reveal delay={180}>
            <div className="mt-6 rounded-sm border border-gold-500/30 bg-gold-500/[0.07] p-4">
              <p className="text-[0.75rem] leading-relaxed text-ink-700">
                <strong className="font-semibold">Review required.</strong> This notice is a working
                draft prepared for the organising team. It must be reviewed and approved - and the
                retention periods confirmed - before production use.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 space-y-4">
            {(page?.body ?? "").split("\n\n").map((para, i) => (
              <Reveal key={i} delay={i * 60}>
                <p className="text-[0.9375rem] leading-relaxed text-ink-600">{para}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 border-t border-ink-900/10 pt-8">
            <h2 className="font-display text-base uppercase tracking-wide text-ink-900">
              What we store
            </h2>
            <ul className="mt-4 space-y-2.5">
              {[
                "Registration details you submit (name, contact, attendance preference).",
                "A random QR credential - it contains no personal information.",
                "Your communication choices, recorded separately from registration.",
                "Prayer requests, visible only to the authorised prayer team.",
                "Audit records of administrative actions, retained for accountability.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-[0.875rem] leading-relaxed text-ink-600">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-xs bg-ink-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap gap-2.5">
            <Link href="/terms" className="btn-outline btn-sm">
              Terms of use
            </Link>
            <Link href="/contact" className="btn-ink btn-sm">
              Ask a data question
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
