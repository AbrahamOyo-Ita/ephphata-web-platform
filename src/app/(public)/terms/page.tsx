import type { Metadata } from "next";
import Link from "next/link";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { getContentPage } from "@/lib/data/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms that apply to registration and attendance at EphaPhata.",
};

export default function TermsPage() {
  const page = getContentPage("terms");

  return (
    <section className="pt-32 pb-24 lg:pt-40">
      <div className="shell-wide">
        <div className="mx-auto max-w-2xl">
          <Reveal variant="fade">
            <p className="eyebrow text-ink-600">Legal</p>
          </Reveal>

          <SplitText
            as="h1"
            text="TERMS OF USE"
            className="mt-5 block font-display text-display-md text-ink-900"
            step={54}
            trigger="mount"
          />

          <Reveal delay={180}>
            <div className="mt-6 rounded-sm border border-gold-500/30 bg-gold-500/[0.07] p-4">
              <p className="text-[0.75rem] leading-relaxed text-ink-700">
                <strong className="font-semibold">Review required.</strong> These terms are a
                working draft for the organising team and must be reviewed and approved before
                production use.
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

          <div className="mt-10 flex flex-wrap gap-2.5">
            <Link href="/privacy" className="btn-outline btn-sm">
              Privacy notice
            </Link>
            <Link href="/contact" className="btn-ink btn-sm">
              Contact the team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
