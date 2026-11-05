import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";

/**
 * Prayer invitation.
 * White reading surface with a single ruled panel. Prayer is the most private
 * action on the site, so it is deliberately NOT a loud campaign band - the
 * contrast with the red registration surface is intentional.
 */
export function PrayerCTA() {
  return (
    <section className="bg-white py-section" aria-labelledby="prayer-heading">
      <div className="shell-wide">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <Reveal duration={400}>
              <p className="label-xs text-ink-400">Prayer</p>
            </Reveal>

            <SplitText
              as="h2"
              id="prayer-heading"
              text="LET US PRAY WITH YOU."
              className="mt-4 block font-display text-display-md text-ink-900"
              step={44}
            />

            <p className="mt-5 max-w-lg text-[1rem] leading-relaxed text-ink-600">
              Every request that comes in is read by a member of the prayer team. Nothing
              is published. Nothing is shared outside the team.
            </p>
          </div>

          <div className="lg:pt-2">
            <p className="flex items-center gap-2 label-xs text-ink-500">
              <Lock className="h-3 w-3" strokeWidth={2.2} />
              Private by default
            </p>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-600">
              You can submit anonymously. Contact details are optional, and only requested if
              you want someone to follow up with you.
            </p>
            <Link href="/prayer" className="btn-ink group mt-6 w-full justify-between">
              Submit a prayer request
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-"
                strokeWidth={2.6}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
