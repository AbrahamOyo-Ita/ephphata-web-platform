"use client";

import { useEffect, useState } from "react";

type Item = { id: string; title: string; owner: string | null; durationMinutes: number };

export function PresentScreen({
  eventId,
  eventTitle,
  items,
  requestedEventId,
}: {
  eventId: string;
  eventTitle: string;
  items: Item[];
  requestedEventId?: string;
}) {
  const [state, setState] = useState<{ currentIndex: number; startedAt: number | null; elapsed: number }>({
    currentIndex: 0,
    startedAt: null,
    elapsed: 0,
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const key = `ephaphata:programme:${requestedEventId || eventId}`;
    const read = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) setState(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) read();
    };
    window.addEventListener("storage", onStorage);
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(t);
    };
  }, [eventId, requestedEventId]);

  const current = items[state.currentIndex];
  const elapsed = state.elapsed + (state.startedAt ? now - state.startedAt : 0);
  const budget = (current?.durationMinutes ?? 0) * 60_000;
  const remaining = budget - elapsed;
  const over = budget > 0 && remaining < 0;

  const total = Math.floor(Math.abs(remaining) / 1000);
  const clock = `${over ? "+" : ""}${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

  return (
    <main className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-ink-900 text-white">
      <header className="flex items-center justify-between px-[3vw] py-[2vh]">
        <p className="text-[clamp(0.7rem,1.4vw,1.1rem)] font-semibold uppercase tracking-[0.3em] text-white/40">
          {eventTitle}
        </p>
        <p className="text-[clamp(0.7rem,1.4vw,1.1rem)] tabular-nums text-white/40">
          {new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </header>

      <div className="flex flex-col items-center justify-center px-[4vw] text-center">
        <p className="text-[clamp(0.7rem,1.6vw,1.3rem)] font-semibold uppercase tracking-[0.35em] text-violet-400">
          Now
        </p>
        <h1 className="mt-[2vh] font-display text-[clamp(2.5rem,9vw,9rem)] uppercase leading-[1.04] tracking-tight">
          {current?.title ?? "Standby"}
        </h1>
        {current?.owner && (
          <p className="mt-[2vh] text-[clamp(1rem,2.4vw,2.2rem)] text-white/60">{current.owner}</p>
        )}

        <p
          className={`mt-[5vh] font-display text-[clamp(4rem,17vw,16rem)] leading-none tabular-nums tracking-tight ${
            over ? "text-flame-400" : "text-white"
          }`}
        >
          {clock}
        </p>
        <p className="text-[clamp(0.65rem,1.4vw,1rem)] font-semibold uppercase tracking-[0.3em] text-white/35">
          {over ? "over running time" : "remaining"}
        </p>
      </div>

      <footer className="flex items-center justify-between px-[3vw] py-[2vh]">
        <p className="text-[clamp(0.65rem,1.2vw,0.95rem)] text-white/30">
          {state.currentIndex + 1} / {items.length} · next: {items[state.currentIndex + 1]?.title ?? "end"}
        </p>
        <p className="text-[clamp(0.65rem,1.2vw,0.95rem)] text-white/30">EPHAPHATA</p>
      </footer>
    </main>
  );
}
