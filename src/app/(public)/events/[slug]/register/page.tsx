import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Clock, Users, Lock, CalendarDays, MapPin } from "lucide-react";
import { RegistrationForm } from "@/components/public/RegistrationForm";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { BrandBG } from "@/components/brand/BrandBG";
import { canRegisterErrorMessage, getEventBySlug, isPublicEvent, isRegistrationOpen } from "@/lib/data/events";
import { db } from "@/lib/db";
import { eventDateParts, formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  return {
    title: event ? `Register - ${event.title}` : "Register",
    description: event?.summary ?? undefined,
  };
}

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  // A draft or archived event has no public registration page.
  if (!event || !isPublicEvent(event)) notFound();

  const open = isRegistrationOpen(event);
  const reason = canRegisterErrorMessage(event);
  const d = eventDateParts(event.starts_at);

  const count = (
    db
      .prepare(
        "SELECT count(*) AS n FROM registrations WHERE event_id = ? AND status='confirmed' AND deleted_at IS NULL"
      )
      .get(event.id) as { n: number }
  ).n;

  if (!open) {
    return (
      <section className="pt-32 pb-24 lg:pt-40">
        <div className="shell-wide max-w-2xl">
          <Reveal variant="fade">
            <Link
              href={`/events/${event.slug}`}
              className="link-sweep inline-flex text-[0.8125rem] text-ink-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to event
            </Link>
          </Reveal>
          <SplitText
            as="h1"
            text="REGISTRATION CLOSED"
            className="mt-8 block font-display text-display-md text-ink-900"
            trigger="mount"
            step={50}
          />
          <Reveal delay={160}>
            <p className="mt-5 text-body-lg leading-relaxed text-ink-600">{reason}</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/events" className="btn-ink">
                See other gatherings
              </Link>
              <Link href="/contact" className="btn-outline">
                Contact the team
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Compact event summary - art full-bleed, one narrow wash for the type */}
      <BrandBG
        family={event.hero_bg as "green" | "multicolor" | "red" | "pink" | "blue"}
        priority
        overlay
        className="text-white"
      >
        <div className="shell-wide pb-10 pt-28 lg:pb-12 lg:pt-32">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-white/65 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {event.title}
          </Link>

          <SplitText
            as="h1"
            text="RESERVE YOUR PLACE"
            className="mt-5 block font-display text-display-md text-white"
            step={54}
            trigger="mount"
          />

          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-white/30 pt-4">
            <span className="font-editorial text-[clamp(1.3rem,2.8vw,2rem)] italic leading-none text-white">
              {event.theme?.toLowerCase() ?? "the new"}
            </span>
            <span className="label-xs text-white/60">{event.scripture}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.8125rem] text-white/75">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
              {formatEventDate(event.starts_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
              {event.venue_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              {count} registered
            </span>
          </div>
        </div>
      </BrandBG>

      {/* Form */}
      <section className="bg-white py-14 lg:py-20">
        <div className="shell-wide">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16">
            <div className="max-w-2xl">
              <Reveal variant="fade">
                <h2 className="font-display text-display-sm uppercase text-ink-900">
                  YOUR DETAILS
                </h2>
                <p className="mt-1.5 text-[0.8125rem] text-ink-500">
                  We only ask for what we need to run the gathering safely.
                </p>
              </Reveal>

              <div className="mt-7">
                <RegistrationForm eventSlug={event.slug} eventTitle={event.title} />
              </div>
            </div>

            {/* Sticky reassurance panel */}
            <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <Reveal delay={140} variant="right">
                <div className="border-t-2 border-ink-900 pt-5">
                  <p className="label-xs text-ink-400">What happens next</p>
                  <ol className="mt-5 space-y-4">
                    {[
                      {
                        n: "01",
                        t: "Instant confirmation",
                        b: "You'll land on a confirmation page with your reference and QR code.",
                      },
                      {
                        n: "02",
                        t: "Save your QR code",
                        b: "Screenshot it or print it. Network at the venue may be limited.",
                      },
                      {
                        n: "03",
                        t: "Arrive early",
                        b: "Doors open an hour before the start time. Check-in is at the main entrance.",
                      },
                    ].map((step) => (
                      <li key={step.n} className="flex gap-3">
                        <span className="font-display text-sm text-ink-300">{step.n}</span>
                        <div>
                          <p className="text-[0.8125rem] font-semibold text-ink-800">{step.t}</p>
                          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-ink-500">{step.b}</p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-6 space-y-3 border-t border-ink-900/10 pt-5">
                    <p className="flex items-start gap-2 text-[0.6875rem] leading-relaxed text-ink-500">
                      <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
                      Your details are used only for this event. We never sell contact lists.
                    </p>
                    <p className="flex items-start gap-2 text-[0.6875rem] leading-relaxed text-ink-500">
                      <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
                      Your QR code contains a random token - no personal information.
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-ink-900/15 pt-5">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    This gathering
                  </p>
                  <p className="mt-2 font-display text-[0.9375rem] uppercase tracking-wide text-ink-900">
                    {event.title}
                  </p>
                  <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-500">
                    {event.venue_name}
                    <br />
                    {event.venue_address}
                  </p>
                  <p className="mt-3 border-l-2 border-ink-900/25 pl-3 text-[0.6875rem] leading-relaxed text-ink-600">
                    All-standing gathering - no physical seats.
                  </p>
                </div>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
