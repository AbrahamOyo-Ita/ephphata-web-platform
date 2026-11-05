"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number; expired: boolean };

function diff(targetIso: string): Parts {
  const ms = Math.max(0, new Date(targetIso).getTime() - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
    expired: ms === 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Event countdown.
 * Renders a stable server-side placeholder that matches the first client frame
 * closely (values arrive after mount), avoiding layout shift and hydration
 * mismatch on a live-dynamic value.
 */
export function Countdown({
  target,
  variant = "cards",
  className = "",
}: {
  target: string;
  variant?: "cards" | "inline";
  className?: string;
}) {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    setParts(diff(target));
    const t = window.setInterval(() => setParts(diff(target)), 1000);
    return () => window.clearInterval(t);
  }, [target]);

  const units = [
    { label: "Days", value: parts ? pad(parts.days) : "--" },
    { label: "Hours", value: parts ? pad(parts.hours) : "--" },
    { label: "Mins", value: parts ? pad(parts.minutes) : "--" },
    { label: "Secs", value: parts ? pad(parts.seconds) : "--" },
  ];

  if (variant === "inline") {
    return (
      <div
        role="timer"
        aria-live="off"
        className={`flex items-baseline gap-2 font-display text-[0.9375rem] uppercase tracking-[0.06em] ${className}`}
      >
        {units.map((u, i) => (
          <span key={u.label} className="flex items-baseline gap-1">
            <span className="tabular-nums">{u.value}</span>
            <span className="text-[0.6875rem] uppercase tracking-[0.12em] opacity-50">
              {u.label}
            </span>
            {i < units.length - 1 && <span className="opacity-25">/</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-4 gap-2 sm:gap-3 ${className}`} role="timer" aria-live="off">
      {units.map((u) => (
        <div
          key={u.label}
          className="border-t border-current/30 px-1 pt-2 text-center sm:px-3"
        >
          <div className="font-display text-2xl leading-none tabular-nums text-current sm:text-4xl">
            {u.value}
          </div>
          <div className="mt-1.5 text-[0.5625rem] font-semibold uppercase tracking-[0.16em] opacity-60">
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}
