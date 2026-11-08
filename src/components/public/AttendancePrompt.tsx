"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";

export function AttendancePrompt({ registerHref }: { registerHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("ephaphata-attendance-prompt-seen")) return;
    } catch {
      // If storage is unavailable, the prompt still works for this visit.
    }

    const timer = window.setTimeout(() => setOpen(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      window.sessionStorage.setItem("ephaphata-attendance-prompt-seen", "1");
    } catch {
      // Ignore privacy-mode storage errors.
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-ink-900/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="attendance-prompt-title">
      <div className="relative grid max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-white shadow-2xl md:grid-cols-[minmax(0,0.9fr)_minmax(280px,1.1fr)]">
        <button type="button" onClick={dismiss} aria-label="Close attendance prompt" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center bg-white/90 text-ink-900 hover:bg-white">
          <X className="h-5 w-5" />
        </button>
        <div className="bg-ink-900 p-5 md:p-7">
          <img src="/brand/flyers/unical-lineup.webp" alt="Ephphata UNICAL 2026 flyer" className="mx-auto h-full max-h-[58vh] w-full object-contain" />
        </div>
        <div className="flex flex-col justify-center p-7 md:p-10">
          <p className="label-xs text-ink-400">Ephphata UNICAL 2026</p>
          <h2 id="attendance-prompt-title" className="mt-3 font-display text-display-sm uppercase text-ink-900">Are you joining us?</h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-600">Confirm your attendance now and reserve your place at the gathering.</p>
          <Link href={registerHref} onClick={dismiss} className="btn-ink btn-lg group mt-7 w-full justify-center">
            Confirm attendance
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <button type="button" onClick={dismiss} className="mt-4 text-[0.75rem] font-semibold text-ink-400 underline underline-offset-4 hover:text-ink-900">Maybe later</button>
        </div>
      </div>
    </div>
  );
}
