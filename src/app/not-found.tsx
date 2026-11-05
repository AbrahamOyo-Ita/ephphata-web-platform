import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandBG } from "@/components/brand/BrandBG";
import { SplitText } from "@/components/motion/SplitText";

export default function NotFound() {
  return (
    <div className="min-h-[100svh] bg-white">
      <div className="flex min-h-[70svh] flex-col justify-center shell-wide pb-16 pt-28">
        <div className="max-w-2xl">
          <p className="label-xs text-ink-400">Error 404</p>

          <SplitText
            as="h1"
            text="THIS PAGE ISN'T HERE."
            className="mt-5 block font-display text-display-lg text-ink-900"
            step={56}
            trigger="mount"
          />

          <p className="mt-6 max-w-md text-body-lg leading-relaxed text-ink-600">
            The link may be out of date, or the page may have moved. Let&apos;s get you back to
            solid ground.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="btn-ink group">
              Back to home
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2.6}
              />
            </Link>
            <Link href="/events" className="btn-outline">
              Browse events
            </Link>
          </div>

          <div className="mt-14 grid gap-3 border-t border-ink-900/15 pt-8 sm:grid-cols-3">
            {[
              { label: "Register", href: "/events" },
              { label: "Volunteer", href: "/volunteer" },
              { label: "Prayer", href: "/prayer" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between border-t border-ink-900/15 py-3 transition-colors hover:border-ink-900/50"
              >
                <span className="text-[0.8125rem] font-semibold">{l.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Brand colour strip closes the page, artwork at full fidelity */}
      <BrandBG family="blue" overlay={false} priority className="h-[clamp(80px,10vw,140px)] w-full">
        <span className="sr-only">EphaPhata blue brand artwork</span>
      </BrandBG>
    </div>
  );
}
