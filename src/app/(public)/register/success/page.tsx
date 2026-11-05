import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Check,
  CalendarDays,
  MapPin,
  Printer,
  Mail,
  MailX,
  AlertTriangle,
  Copy,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { findRegistrationByReference } from "@/lib/data/registrations";
import { getEventById } from "@/lib/data/events";
import { formatEventDate, buildIcs, eventDateParts } from "@/lib/format";
import { notificationSummary } from "@/lib/notifications";
import { PrintButton, CopyReference } from "@/components/public/ConfirmationActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registration confirmed",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  if (!ref) {
    return (
      <section className="pt-32 pb-24 lg:pt-40">
        <div className="shell-wide max-w-lg text-center">
          <h1 className="font-display text-display-sm text-ink-900">NO REFERENCE PROVIDED</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-600">
            Open the link from your confirmation email, or look up your registration from the
            events page.
          </p>
          <Link href="/events" className="btn-ink mt-8">
            Back to events
          </Link>
        </div>
      </section>
    );
  }

  const reg = findRegistrationByReference(ref);

  if (!reg) {
    return (
      <section className="pt-32 pb-24 lg:pt-40">
        <div className="shell-wide max-w-lg">
          <div className="rounded-md border border-ink-900/10 bg-paper-50 p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xs bg-ink-900/5">
              <AlertTriangle className="h-5 w-5 text-ink-500" strokeWidth={2} />
            </div>
            <h1 className="mt-5 font-display text-xl uppercase tracking-wide text-ink-900">
              We couldn&apos;t find that reference
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[0.875rem] leading-relaxed text-ink-600">
              We searched for <span className="font-mono font-semibold text-ink-900">{ref}</span> but
              nothing matched. Check the reference in your confirmation email, or contact the team.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Link href="/events" className="btn-ink btn-sm">
                Browse events
              </Link>
              <Link href="/contact" className="btn-outline btn-sm">
                Contact the team
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const event = getEventById(reg.event_id);
  const d = event ? eventDateParts(event.starts_at) : null;

  // The QR encodes an opaque token only - never a name, email or reference.
  const qrPayload = `/c/${reg.qr_token}`;
  const qrSvg = await QRCode.toString(qrPayload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    width: 260,
    color: { dark: "#111111", light: "#ffffff" },
  });

  const ics = event
    ? buildIcs({
        title: event.title,
        description: `Your reference: ${reg.reference}`,
        location: [event.venue_name, event.venue_address].filter(Boolean).join(", "),
        start: event.starts_at,
        end: event.ends_at ?? event.starts_at,
        uid: reg.id,
      })
    : "";

  // Did a confirmation email actually go out? Report the truth.
  const { recent } = notificationSummary();
  const logEntry = recent.find((n) => n.template === "registration_confirmation" && n.recipient === reg.email);
  const emailNotConfigured = !logEntry || logEntry.status === "not_configured";

  return (
    <>
      {/* ── Success band ──────────────────────────────────────── */}
      <section className="bg-ink-900 pt-28 pb-14 text-white lg:pt-32">
        <div className="shell-wide">
          <Reveal variant="fade" duration={600}>
            <div className="inline-flex items-center gap-2 rounded-xs bg-emerald-500 px-3.5 py-1.5">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em]">
                Registration complete
              </span>
            </div>
          </Reveal>

          <SplitText
            as="h1"
            text={`YOU'RE IN, ${reg.first_name.toUpperCase()}.`}
            className="mt-5 block font-display text-display-md text-white"
            step={54}
            trigger="mount"
          />

          <Reveal delay={180}>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/65">
              Your place at {event?.title ?? "the gathering"} is confirmed. Save this page or
              screenshot your QR code - you&apos;ll need it at the door.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Ticket ────────────────────────────────────────────── */}
      <section className="bg-paper-50 py-14 lg:py-20">
        <div className="shell-wide">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
            {/* Left: details */}
            <Reveal variant="up" duration={700}>
              <div className="overflow-hidden rounded-xs border border-ink-900/[0.08] bg-white">
                <div className="border-b border-dashed border-ink-900/15 p-6 sm:p-8">
                  <p className="eyebrow text-ink-400">Your registration</p>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Reference
                      </p>
                      <p className="mt-1 font-mono text-[clamp(1.4rem,4vw,2rem)] font-bold leading-none tracking-tight text-ink-900">
                        {reg.reference}
                      </p>
                    </div>
                    <CopyReference value={reg.reference} />
                  </div>

                  <dl className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Name
                      </dt>
                      <dd className="mt-1 text-[0.875rem] font-medium text-ink-900">
                        {reg.first_name} {reg.last_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Email
                      </dt>
                      <dd className="mt-1 truncate text-[0.875rem] font-medium text-ink-900">
                        {reg.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Date & time
                      </dt>
                      <dd className="mt-1 text-[0.875rem] font-medium text-ink-900">
                        {event ? formatEventDate(event.starts_at) : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Venue
                      </dt>
                      <dd className="mt-1 text-[0.875rem] font-medium leading-snug text-ink-900">
                        {event?.venue_name ?? "-"}
                        {event?.venue_address && (
                          <span className="block text-[0.75rem] font-normal text-ink-500">
                            {event.venue_address}
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Attendance status */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-paper-50 px-6 py-4 sm:px-8">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-xs ${
                        reg.checked_in_at ? "bg-emerald-500" : "bg-ink-300"
                      }`}
                    />
                    <span className="text-[0.75rem] font-medium text-ink-700">
                      {reg.checked_in_at
                        ? "Checked in - you're marked as attended"
                        : "Not yet checked in - this updates when you scan at the door"}
                    </span>
                  </div>
                  <span className="rounded-xs bg-white px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-ink-500 ring-1 ring-ink-900/10">
                    {reg.source === "admin" ? "Registered by staff" : "Self-registered"}
                  </span>
                </div>
              </div>

              {/* Email status - honest reporting */}
              <div
                className={`mt-4 flex items-start gap-3 rounded-md border p-4 ${
                  emailNotConfigured
                    ? "border-gold-500/30 bg-gold-500/[0.07]"
                    : "border-emerald-300/50 bg-emerald-50"
                }`}
              >
                {emailNotConfigured ? (
                  <MailX className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" strokeWidth={2.2} />
                ) : (
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.2} />
                )}
                <div className="text-[0.75rem] leading-relaxed text-ink-700">
                  <p className="font-semibold">
                    {emailNotConfigured
                      ? "Your registration is saved - confirmation email is not configured"
                      : `Confirmation sent to ${reg.email}`}
                  </p>
                  <p className="mt-0.5 text-ink-500">
                    {emailNotConfigured
                      ? "The email provider has not been connected for this deployment yet. Your place is confirmed in the system regardless - please save or print this page."
                      : "If it doesn't arrive within a few minutes, check your spam folder or save this page."}
                  </p>
                </div>
              </div>

              {reg.checked_in_at && (
                <p className="mt-3 flex items-center gap-2 rounded-sm bg-emerald-50 px-4 py-3 text-[0.75rem] text-emerald-900">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Checked in at {new Date(reg.checked_in_at.replace(" ", "T") + "Z").toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </Reveal>

            {/* Right: QR ticket */}
            <Reveal delay={160} variant="right" duration={700}>
              <div className="overflow-hidden rounded-xs bg-ink-900 text-white">
                <div className="p-6 text-center">
                  <p className="text-[0.5625rem] font-bold uppercase tracking-[0.22em] text-white/40">
                    Your entry pass
                  </p>

                  <div className="mx-auto mt-5 w-full max-w-[210px] rounded-md bg-white p-4">
                    <div
                      className="[&>svg]:h-auto [&>svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                      aria-label="Registration QR code"
                      role="img"
                    />
                  </div>

                  <p className="mt-4 font-display text-[1.05rem] uppercase tracking-wide">
                    {reg.first_name} {reg.last_name}
                  </p>
                  <p className="mt-1 font-mono text-[0.75rem] tracking-wide text-white/50">
                    {reg.reference}
                  </p>

                  {event && d && (
                    <div className="mt-5 flex items-center justify-center gap-4 border-t border-white/15 pt-5">
                      <div className="text-center">
                        <p className="font-display text-2xl leading-none">{d.day}</p>
                        <p className="mt-1 text-[0.5rem] font-bold uppercase tracking-[0.15em] text-white/45">
                          {d.monthShort}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-white/20" />
                      <div className="text-center">
                        <p className="font-display text-2xl leading-none">{d.time.replace("PM", "").replace("AM", "")}</p>
                        <p className="mt-1 text-[0.5rem] font-bold uppercase tracking-[0.15em] text-white/45">
                          {d.time.includes("PM") ? "PM" : "AM"}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-white/20" />
                      <div className="text-center">
                        <p className="font-display text-2xl leading-none">1</p>
                        <p className="mt-1 text-[0.5rem] font-bold uppercase tracking-[0.15em] text-white/45">
                          Guest
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-white/10 p-4">
                  <PrintButton />
                  {event && (
                    <a
                      href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`}
                      download={`${event.slug}.ics`}
                      className="flex w-full items-center justify-center gap-2 rounded-xs border border-white/25 px-4 py-2.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.2} />
                      Add to calendar
                    </a>
                  )}
                </div>
              </div>

              <p className="mt-4 text-center text-[0.6875rem] leading-relaxed text-ink-400">
                Present this QR code at the check-in desk. It contains no personal information.
              </p>
            </Reveal>
          </div>

          {/* Next steps */}
          <Reveal delay={240}>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Printer,
                  title: "Save your pass",
                  body: "Screenshot the QR code now - network at the venue may be unreliable.",
                },
                {
                  icon: CalendarDays,
                  title: "Plan to arrive early",
                  body: "Doors open one hour before the start. Check-in is at the main entrance.",
                },
                {
                  icon: MapPin,
                  title: "Find the venue",
                  body: event?.venue_name ?? "Venue details on the event page.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-md border border-ink-900/[0.08] bg-white p-5">
                  <Icon className="h-4 w-4 text-ink-400" strokeWidth={2} />
                  <p className="mt-3 text-[0.8125rem] font-semibold text-ink-900">{title}</p>
                  <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-500">{body}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink-900/10 pt-8">
              <p className="text-[0.8125rem] text-ink-500">
                Questions about your registration?{" "}
                <Link href="/contact" className="font-semibold text-ink-900 underline underline-offset-2">
                  Contact the team
                </Link>
              </p>
              <div className="flex gap-2.5">
                <Link href="/volunteer" className="btn-outline btn-sm">
                  Volunteer instead
                </Link>
                <Link href="/events" className="btn-ink btn-sm group">
                  Other gatherings
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
