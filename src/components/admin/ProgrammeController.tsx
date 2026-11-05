"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ExternalLink,
  Radio,
  Clock,
  AlertTriangle,
} from "lucide-react";

type Item = {
  id: string;
  title: string;
  kind: string;
  startsAt: string | null;
  durationMinutes: number | null;
  owner: string | null;
  notes: string | null;
};

const STORAGE_KEY = "ephaphata:programme";

export type ProgrammeState = {
  currentIndex: number;
  /** epoch ms when the current segment started, null if paused/not started */
  startedAt: number | null;
  /** accumulated ms on the current segment before the latest start */
  elapsed: number;
};

function loadState(eventId: string): ProgrammeState {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${eventId}`);
    if (raw) return JSON.parse(raw) as ProgrammeState;
  } catch {
    /* ignore */
  }
  return { currentIndex: 0, startedAt: null, elapsed: 0 };
}

/**
 * Programme controller.
 * State lives in localStorage so the controller and the presentation window
 * (a separate tab/display) stay in sync without a websocket - the
 * `storage` event fires across tabs of the same origin.
 */
export function ProgrammeController({
  eventId,
  eventTitle,
  items,
  canManage,
}: {
  eventId: string;
  eventTitle: string;
  items: Item[];
  canManage: boolean;
}) {
  const [state, setState] = useState<ProgrammeState>({ currentIndex: 0, startedAt: null, elapsed: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const writeRef = useRef(false);

  useEffect(() => {
    setState(loadState(eventId));
    setHydrated(true);

    function onStorage(e: StorageEvent) {
      if (e.key === `${STORAGE_KEY}:${eventId}` && e.newValue) {
        writeRef.current = false;
        setState(JSON.parse(e.newValue) as ProgrammeState);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [eventId]);

  function commit(next: ProgrammeState) {
    setState(next);
    try {
      localStorage.setItem(`${STORAGE_KEY}:${eventId}`, JSON.stringify(next));
    } catch {
      /* storage blocked - controller still works locally */
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [hydrated]);

  const current = items[state.currentIndex];

  const elapsedMs = useMemo(() => {
    if (!current) return 0;
    return state.elapsed + (state.startedAt ? now - state.startedAt : 0);
  }, [current, state.elapsed, state.startedAt, now]);

  const budgetMs = (current?.durationMinutes ?? 0) * 60_000;
  const remainingMs = budgetMs - elapsedMs;
  const overtime = budgetMs > 0 && remainingMs < 0;
  const pct = budgetMs > 0 ? Math.min(100, (elapsedMs / budgetMs) * 100) : 0;

  function fmt(ms: number) {
    const total = Math.floor(Math.abs(ms) / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${overtime ? "+" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function play() {
    if (!current) return;
    commit({ ...state, startedAt: Date.now() });
  }
  function pause() {
    const next = { ...state, elapsed: elapsedMs, startedAt: null };
    commit(next);
  }
  function next() {
    if (state.currentIndex >= items.length - 1) return;
    commit({ currentIndex: state.currentIndex + 1, startedAt: null, elapsed: 0 });
  }
  function reset() {
    commit({ ...state, startedAt: null, elapsed: 0 });
  }

  const running = Boolean(state.startedAt);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      {/* Current segment + timer */}
      <div className="space-y-4">
        <div
          className={`relative overflow-hidden rounded-sm border p-5 transition-colors ${
            overtime
              ? "border-flame-500/40 bg-flame-50"
              : running
                ? "border-emerald-300/60 bg-emerald-50/40"
                : "border-ink-900/[0.08] bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-xs bg-ink-900 px-2.5 py-1 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-white">
              <Radio className={`h-2.5 w-2.5 ${running ? "animate-pulse text-emerald-400" : ""}`} strokeWidth={3} />
              {running ? "On air" : "Standby"}
            </span>
            <span className="text-[0.625rem] tabular-nums text-ink-400">
              Segment {state.currentIndex + 1} of {items.length}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-semibold uppercase leading-tight tracking-[-0.01em] text-ink-900">
            {current?.title ?? "No segment"}
          </h2>
          {current?.owner && (
            <p className="mt-1 text-[0.8125rem] text-ink-500">{current.owner}</p>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span
              className={`font-display text-6xl leading-none tabular-nums tracking-[-0.02em] sm:text-7xl ${
                overtime ? "text-flame-600" : "text-ink-900"
              }`}
            >
              {fmt(overtime ? -remainingMs : Math.max(0, remainingMs))}
            </span>
            <span className="pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
              {overtime ? "over" : "remaining"}
            </span>
          </div>

          {budgetMs > 0 && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-xs bg-ink-900/[0.08]">
              <div
                className={`h-full rounded-xs transition-[width] duration-500 ease-linear ${
                  overtime ? "bg-flame-500" : pct > 85 ? "bg-gold-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          )}

          {current?.notes && (
            <p className="mt-3 rounded-xs bg-white/70 px-3 py-2 text-[0.75rem] leading-relaxed text-ink-600">
              {current.notes}
            </p>
          )}

          {canManage ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {running ? (
                <button type="button" onClick={pause} className="btn-ink btn-sm">
                  <Pause className="h-3.5 w-3.5" strokeWidth={2.6} />
                  Pause
                </button>
              ) : (
                <button type="button" onClick={play} className="btn-ink btn-sm">
                  <Play className="h-3.5 w-3.5" strokeWidth={2.6} />
                  {state.elapsed > 0 ? "Resume" : "Start segment"}
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={state.currentIndex >= items.length - 1}
                className="btn-outline btn-sm disabled:opacity-40"
              >
                <SkipForward className="h-3.5 w-3.5" strokeWidth={2.4} />
                Next segment
              </button>
              <button type="button" onClick={reset} className="btn-outline btn-sm">
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.4} />
                Reset
              </button>
            </div>
          ) : (
            <p className="mt-4 text-[0.6875rem] text-ink-400">
              Read-only - a programme manager runs the timer.
            </p>
          )}
        </div>

        {overtime && (
          <div role="alert" className="flex items-start gap-2.5 rounded-sm border border-flame-500/30 bg-flame-50 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-flame-600" strokeWidth={2.4} />
            <div>
              <p className="text-[0.75rem] font-semibold text-flame-600">Running over</p>
              <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-600">
                This segment has exceeded its allotted time. Notify the stage manager or move on.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Presentation screen
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-500">
            Open the presentation view on the confidence monitor or projector. It mirrors this
            controller live - including the running clock.
          </p>
          <Link
            href={`/admin/programme/present?event=${eventId}`}
            target="_blank"
            rel="noopener"
            className="btn-outline btn-sm mt-3"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Launch
          </Link>
        </div>
      </div>

      {/* Run of show */}
      <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
        <div className="border-b border-ink-900/[0.07] px-4 py-3">
          <h2 className="text-[0.8125rem] font-semibold text-ink-900">Run of show</h2>
          <p className="text-[0.625rem] text-ink-400">{eventTitle}</p>
        </div>
        <ol className="divide-y divide-ink-900/[0.05]">
          {items.map((item, i) => {
            const isCurrent = i === state.currentIndex;
            const isPast = i < state.currentIndex;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => commit({ currentIndex: i, startedAt: null, elapsed: 0 })}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isCurrent ? "bg-ink-900 text-white" : isPast ? "opacity-45 hover:bg-paper-50" : "hover:bg-paper-50"
                  } ${canManage ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-xs text-[0.5625rem] font-bold tabular-nums ${
                      isCurrent ? "bg-white text-ink-900" : "bg-paper-100 text-ink-500"
                    }`}
                  >
                    {isPast ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[0.75rem] font-medium ${isCurrent ? "text-white" : "text-ink-800"}`}>
                      {item.title}
                    </p>
                    <p className={`truncate text-[0.625rem] ${isCurrent ? "text-white/60" : "text-ink-400"}`}>
                      {item.owner ?? item.kind.replace("_", " ")}
                    </p>
                  </div>
                  {item.durationMinutes && (
                    <span
                      className={`shrink-0 text-[0.5625rem] tabular-nums ${
                        isCurrent ? "text-white/60" : "text-ink-400"
                      }`}
                    >
                      <Clock className="mr-0.5 inline h-2.5 w-2.5" />
                      {item.durationMinutes}m
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
