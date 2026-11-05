import Link from "next/link";
import { ArrowRight, HandHeart } from "lucide-react";
import { BrandBG } from "@/components/brand/BrandBG";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";

const DEPARTMENTS = [
  "Ushers & Seating",
  "Registration",
  "Protocol",
  "Hospitality",
  "Media",
  "Photography & Video",
  "Technical Production",
  "Prayer & Counselling",
  "Security",
  "Follow-up",
];

/**
 * Volunteer invitation.
 * Blue asset full-bleed with a wash built from its own blues and navies.
 * Departments are a plain ruled list, not ten rounded cards.
 */
export function VolunteerInvite() {
  return (
    <BrandBG family="blue" overlay className="text-white">
      <div className="shell-wide py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div className="max-w-xl">
            <Reveal duration={400}>
              <p className="label-xs text-white/65">Serve</p>
            </Reveal>

            <SplitText
              as="h2"
              id="volunteer-heading"
              text="BEHIND THE MOMENT"
              className="mt-4 block font-display text-display-md text-white"
              step={44}
            />

            <p className="mt-6 text-[1rem] leading-relaxed text-white/85">
              Some of the most significant work at Ephphata happens before the first note -
              in car parks, at the registration desk, behind camera rigs and in the prayer room.
            </p>

            <Link href="/volunteer" className="btn-white btn-lg group mt-9">
              <HandHeart className="h-4 w-4" strokeWidth={2.2} />
              Apply to serve
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <p className="mt-5 max-w-sm text-[0.75rem] leading-relaxed text-white/65">
              Applications are reviewed personally by the volunteer coordination team.
              You will hear back either way.
            </p>
          </div>

          <div className="lg:pt-1">
            <p className="label-xs text-white/60">Ten departments</p>
            <ol className="mt-5 grid gap-x-10 gap-y-1 sm:grid-cols-2">
              {DEPARTMENTS.map((name, i) => (
                <li
                  key={name}
                  className="flex items-baseline justify-between gap-3 py-2"
                >
                  <span className="text-[0.875rem] font-medium text-white">{name}</span>
                  <span className="text-[0.6875rem] tabular-nums text-white/35">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </BrandBG>
  );
}
