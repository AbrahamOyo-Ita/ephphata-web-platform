"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { navigation } from "@/lib/site";

/**
 * Site header.
 * ------------------------------------------------------------------
 * A clean editorial bar: solid white, black type, hairline rule, ink accent on
 * the active item. Previously it was transparent over the hero and switched to
 * a frosted, blurred bar on scroll - both removed. No glass, no shadow, no
 * height jump.
 * - Keyboard accessible mobile drawer with focus management and scroll lock.
 */
export function SiteHeader({ registerHref = "/events" }: { registerHref?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on navigation
  useEffect(() => setOpen(false), [pathname]);

  // Scroll lock + escape to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-ink-900/12 bg-white"
      >
        <div className="shell-wide">
          <div
            className="flex h-[62px] items-center justify-between lg:h-[70px]"
          >
            {/* Wordmark */}
            <Link
              href="/"
              aria-label="EphaPhata - home"
              className="group flex items-center gap-2.5"
            >
              <span className="grid h-8 w-8 place-items-center bg-ink-900">
                <EphMark className="h-4 w-4 text-white" />
              </span>
              <span className="flex flex-col leading-none">
                <span
                  className="font-display text-[1.15rem] tracking-[0.02em] text-ink-900"
                >
                  EPHAPHATA
                </span>
                <span
                  className="mt-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.2em] text-ink-400"
                >
                  with OT Power
                </span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-150 ${
                      active ? "text-ink-900" : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute inset-x-3 -bottom-px h-[2px] bg-ink-900 transition-opacity duration-150 ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href={registerHref}
                className="hidden items-center gap-1.5 rounded-xs bg-ink-900 px-5 py-2.5 text-[0.8125rem] font-semibold text-white transition-colors duration-150 hover:bg-ink-700 sm:inline-flex"
              >
                Register
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />
              </Link>

              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="mobile-menu"
                className="grid h-10 w-10 place-items-center rounded-xs text-ink-900 transition-colors duration-150 hover:bg-ink-900/5 lg:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`fixed inset-0 z-[70] overflow-hidden lg:hidden ${open ? "" : "pointer-events-none"}`}
        style={{ clipPath: open ? undefined : "inset(0)" }}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink-900/50 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          // Hidden off-canvas by transform, but also clipped so a closed drawer
          // can never widen the document (measured as horizontal overflow on mobile).
          className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-hidden bg-white transition-transform duration-300 ease-snap ${
            open ? "translate-x-0" : "translate-x-full invisible"
          }`}
        >
          <div className="flex items-center justify-between border-b border-ink-900/10 px-6 py-5">
            <span className="font-display text-lg tracking-wide text-ink-900">MENU</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid h-10 w-10 place-items-center rounded-xs text-ink-700 transition-colors hover:bg-ink-900/5"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
            {navigation.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between border-b border-ink-900/10 rounded-xs px-3 py-3.5 transition-colors duration-150 ${
                  isActive(item.href)
                    ? "bg-ink-900 text-white"
                    : "text-ink-800 hover:bg-paper-100"
                }`}
              >
                <span className="font-display text-xl tracking-wide">{item.label}</span>
                <span className="text-[0.625rem] font-mono opacity-40">
                  0{i + 1}
                </span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-ink-900/10 p-6 pb-safe">
            <Link
              href={registerHref}
              onClick={() => setOpen(false)}
              className="btn-ink w-full"
            >
              Register for EphaPhata
            </Link>
            <Link
              href="/admin/login"
              className="mt-3 block text-center text-[0.75rem] font-medium text-ink-400 hover:text-ink-700"
            >
              Organiser login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/** Simple geometric mark - an "open" aperture suggesting Ephp'hatha ("be opened"). */
function EphMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M20 12a8 8 0 0 1-16 0"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}
