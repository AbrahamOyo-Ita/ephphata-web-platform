import Link from "next/link";
import { ArrowUpRight, QrCode, Mail, CalendarCheck } from "lucide-react";
import { BrandBG } from "@/components/brand/BrandBG";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";

/**
 * Registration banner.
 * ------------------------------------------------------------------
 * The red asset runs full-bleed as the background and the copy sits on it, over
 * a wash built from the asset's own reds - so the pattern still reads behind
 * the type instead of being cut in half by a solid colour block.
 */
export function RegistrationCTA({
  eventSlug,
  eventTitle,
  open,
  note,
}: {
  eventSlug: string | null;
  eventTitle: string;
  open: boolean;
  note?: string | null;
}) {
  const href = eventSlug ? `/events/${eventSlug}/register` : "/events";

  return (
    <BrandBG family="red" overlay className="text-white">
      <div className="shell-wide py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="max-w-2xl">
            <Reveal duration={400}>
              <p className="label-xs text-white/65">Registration</p>
            </Reveal>

            <SplitText
              as="h2"
              id="register-heading"
              text="TAKE YOUR PLACE"
              className="mt-4 block font-display text-display-md text-white"
              step={52}
            />

            <p className="mt-6 max-w-lg text-[1rem] leading-relaxed text-white/85">
              Registration takes under a minute and gives you a QR credential for the door.
              It also lets the team prepare the hall, plan the flow, and send you what you
              need before {eventTitle}.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {open && eventSlug ? (
                <Link href={href} className="btn-white btn-lg group">
                  Register now - it&apos;s free
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={2.6}
                  />
                </Link>
              ) : (
                <span className="btn btn-lg border border-white/45 text-white/80">
                  Registration closed
                </span>
              )}
              <Link
                href={eventSlug ? `/events/${eventSlug}` : "/events"}
                className="btn-outline-light btn-lg"
              >
                Event details
              </Link>
            </div>

            {note && (
              <p className="mt-6 max-w-md text-[0.75rem] leading-relaxed text-white/65">{note}</p>
            )}
          </div>

          {/* Ruled list - no panel, no card */}
          <div className="lg:pt-1">
            <p className="label-xs text-white/60">What you get</p>
            <ul className="mt-5 space-y-5">
              {[
                { icon: QrCode, title: "A QR credential", body: "Fast entry at the door - no paperwork." },
                { icon: CalendarCheck, title: "Event-day details", body: "Time, venue and what to expect." },
                { icon: Mail, title: "One reminder", body: "Nothing else. No noise in your inbox." },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/60" strokeWidth={1.9} />
                  <div>
                    <p className="text-[0.875rem] font-semibold text-white">{title}</p>
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-white/70">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </BrandBG>
  );
}
