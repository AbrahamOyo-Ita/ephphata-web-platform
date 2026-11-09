"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Keyboard,
  Camera,
  CameraOff,
  ScanLine,
  RotateCcw,
  User,
  Clock,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

type Stats = { total: number; checkedIn: number; rate: number };

type Success = {
  ok: true;
  alreadyCheckedIn: boolean;
  checkedInAt: string;
  attendee: {
    name: string;
    reference: string;
    email: string;
    phone: string;
    city: string | null;
    intent: string;
    source: string;
  };
};

type Failure = {
  ok: false;
  code: string;
  error: string;
  registration?: { name: string; reference: string; status: string };
};

type Outcome = Success | Failure;

/**
 * Check-in console.
 * Two modes: camera scanning (BarcodeDetector where supported) and manual entry.
 * The camera is strictly opt-in; manual entry always works, which matters
 * because BarcodeDetector is not available in every browser.
 */
export function CheckinConsole({
  events,
  eventId,
  initialStats,
}: {
  events: { id: string; title: string }[];
  eventId: string;
  initialStats: Stats;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [credential, setCredential] = useState("");
  const [gate, setGate] = useState("Gate A");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [history, setHistory] = useState<
    { name: string; reference: string; at: string; duplicate: boolean }[]
  >([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });

  const submit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      setOutcome(null);

      try {
        const res = await fetch("/api/admin/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, credential: trimmed, gate }),
        });
        const json = (await res.json()) as Outcome;

        setOutcome(json);

        if (json.ok) {
          setCredential("");
          if (!json.alreadyCheckedIn) {
            setStats((s) => {
              const checkedIn = s.checkedIn + 1;
              return { ...s, checkedIn, rate: s.total ? Math.round((checkedIn / s.total) * 100) : 0 };
            });
            setHistory((h) =>
              [
                {
                  name: json.attendee.name,
                  reference: json.attendee.reference,
                  at: json.checkedInAt,
                  duplicate: false,
                },
                ...h,
              ].slice(0, 8)
            );
          }
          router.refresh();
          // Haptic confirmation on supported devices
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(json.alreadyCheckedIn ? [60, 60, 60] : 60);
          }
        } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } catch {
        setOutcome({ ok: false, code: "network", error: "Network problem - check your connection." });
      } finally {
        setBusy(false);
        window.setTimeout(() => inputRef.current?.focus(), 60);
      }
    },
    [busy, eventId, gate, router]
  );

  /* ── Camera scanning ─────────────────────────────────────── */
  useEffect(() => {
    if (mode !== "camera") {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const SupportedDetector =
      typeof window !== "undefined" && "BarcodeDetector" in window;

    if (!SupportedDetector) {
      setCameraSupported(false);
      setCameraError(
        "This browser cannot scan QR codes natively. Use manual entry - it accepts the reference shown on the attendee's pass."
      );
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // @ts-expect-error - BarcodeDetector is not in the TS DOM lib yet
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

        const tick = async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || cancelled) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          try {
            const codes = await detector.detect(video);
            const raw = codes?.[0]?.rawValue as string | undefined;
            if (raw) {
              const now = Date.now();
              // Debounce identical scans for 4s so one pass isn't read 30×
              if (raw !== lastScanRef.current.value || now - lastScanRef.current.at > 4000) {
                lastScanRef.current = { value: raw, at: now };
                await submit(raw);
              }
            }
          } catch {
            /* detection frame skipped */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        setCameraError(null);
      } catch {
        setCameraError(
          "Camera permission was refused or no camera is available. Use manual entry instead."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode, submit]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      {/* ── Left: scanning ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Mode tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Check-in mode" className="inline-flex rounded-xs border border-ink-900/10 bg-white p-1">
            {[
              { key: "manual" as const, label: "Manual entry", icon: Keyboard },
              { key: "camera" as const, label: "Scan QR", icon: Camera },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => setMode(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.75rem] font-semibold transition-colors ${
                  mode === tab.key ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                {tab.label}
              </button>
            ))}
          </div>

          <CustomSelect
            value={gate}
            onChange={setGate}
            aria-label="Gate"
            className="min-w-[9rem]"
            options={["Gate A", "Gate B", "Main", "VIP", "Volunteers", "Walk-in desk"].map((value) => ({ value, label: value }))}
          />

          <span className="ml-auto hidden text-[0.625rem] text-ink-400 sm:block">
            {events.find((e) => e.id === eventId)?.title}
          </span>
        </div>

        {/* Manual entry */}
        {mode === "manual" && (
          <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4 sm:p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(credential);
              }}
            >
              <label htmlFor="credential" className="field-label">
                Registration reference or QR token
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  id="credential"
                  name="credential"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="EPH-26-XXXXXX"
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoFocus
                  aria-describedby="credential-hint"
                  className="input h-12 flex-1 font-mono text-base uppercase tracking-wider"
                />
                <button
                  type="submit"
                  disabled={busy || !credential.trim()}
                  className="btn-ink shrink-0 px-5 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" strokeWidth={2.4} />}
                  <span className="hidden sm:inline">Check in</span>
                </button>
              </div>
              <p id="credential-hint" className="field-hint">
                Type the reference exactly as it appears on the attendee&apos;s pass. Press Enter
                to check in.
              </p>
            </form>
          </div>
        )}

        {/* Camera */}
        {mode === "camera" && (
          <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-ink-900">
            <div className="relative aspect-[4/3] w-full sm:aspect-video">
              <video
                ref={videoRef}
                playsInline
                muted
                aria-label="Camera preview for QR scanning"
                className="h-full w-full object-cover"
              />
              {/* Scan frame */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="relative h-52 w-52">
                  {[
                    "left-0 top-0 border-l-2 border-t-2",
                    "right-0 top-0 border-r-2 border-t-2",
                    "left-0 bottom-0 border-l-2 border-b-2",
                    "right-0 bottom-0 border-r-2 border-b-2",
                  ].map((cls) => (
                    <span key={cls} className={`absolute h-8 w-8 rounded-sm border-white/80 ${cls}`} />
                  ))}
                  <span className="absolute inset-x-0 top-1/2 h-px animate-pulse bg-white/50" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-ink-900/55 p-4 pt-10">
                <p className="text-center text-[0.75rem] text-white/80">
                  Point the camera at the attendee&apos;s QR code
                </p>
              </div>
            </div>

            {cameraError && (
              <div className="flex items-start gap-2.5 bg-flame-900/80 p-4">
                <CameraOff className="mt-0.5 h-4 w-4 shrink-0 text-white/80" strokeWidth={2.2} />
                <div>
                  <p className="text-[0.75rem] leading-relaxed text-white/90">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className="mt-2 rounded-xs bg-white px-3 py-1.5 text-[0.6875rem] font-semibold text-ink-900"
                  >
                    Switch to manual entry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outcome */}
        {outcome && <OutcomeCard outcome={outcome} onReset={() => setOutcome(null)} />}
      </div>

      {/* ── Right: live stats + history ────────────────────── */}
      <div className="space-y-4">
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Live attendance
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-semibold leading-none tabular-nums text-ink-900">
              {stats.checkedIn}
            </span>
            <span className="mb-1 text-[0.875rem] text-ink-400">/ {stats.total}</span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-xs bg-ink-900/[0.07]">
            <div
              className="h-full rounded-xs bg-emerald-500 transition-colors duration-700 ease-brand"
              style={{ width: `${Math.min(100, stats.rate)}%` }}
            />
          </div>
          <p className="mt-2 text-[0.6875rem] text-ink-400">
            {stats.rate}% of registered attendees have arrived
          </p>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md text-[0.6875rem] font-semibold text-ink-900 underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            <RotateCcw className="h-3 w-3" />
            Refresh totals
          </button>
        </div>

        <div className="rounded-sm border border-ink-900/[0.08] bg-white">
          <div className="border-b border-ink-900/[0.07] px-4 py-3">
            <h2 className="text-[0.8125rem] font-semibold text-ink-900">This session</h2>
            <p className="text-[0.625rem] text-ink-400">Check-ins recorded on this device</p>
          </div>
          <ul className="divide-y divide-ink-900/[0.05]">
            {history.length === 0 ? (
              <li className="px-4 py-8 text-center text-[0.75rem] text-ink-400">
                No check-ins yet in this session.
              </li>
            ) : (
              history.map((h) => (
                <li key={h.reference + h.at} className="flex items-center gap-2.5 px-4 py-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.4} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.75rem] font-medium text-ink-800">{h.name}</p>
                    <p className="font-mono text-[0.625rem] text-ink-400">{h.reference}</p>
                  </div>
                  <span className="shrink-0 text-[0.5625rem] tabular-nums text-ink-400">
                    {new Date(h.at.replace(" ", "T") + "Z").toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function OutcomeCard({ outcome, onReset }: { outcome: Outcome; onReset: () => void }) {
  if (outcome.ok) {
    const dup = outcome.alreadyCheckedIn;
    return (
      <div
        role="status"
        aria-live="assertive"
        className={`rounded-sm border p-4 ${
          dup ? "border-gold-500/40 bg-gold-500/[0.08]" : "border-emerald-300/60 bg-emerald-50"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xs text-white ${
              dup ? "bg-gold-700" : "bg-emerald-500"
            }`}
          >
            {dup ? (
              <AlertTriangle className="h-5 w-5" strokeWidth={2.4} />
            ) : (
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.6} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className={`text-[0.875rem] font-bold ${dup ? "text-gold-700" : "text-emerald-800"}`}>
              {dup ? "Already checked in" : "Checked in successfully"}
            </p>
            <p className="mt-1 text-xl font-semibold leading-tight tracking-[-0.02em] text-ink-900">
              {outcome.attendee.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-ink-600">
              <span className="font-mono">{outcome.attendee.reference}</span>
              <span className="h-1 w-1 rounded-xs bg-ink-300" />
              <span className="capitalize">{outcome.attendee.intent.replace("_", " ")}</span>
              <span className="h-1 w-1 rounded-xs bg-ink-300" />
              <span className="capitalize">{outcome.attendee.source}-registered</span>
              {outcome.attendee.city && (
                <>
                  <span className="h-1 w-1 rounded-xs bg-ink-300" />
                  <span>{outcome.attendee.city}</span>
                </>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[0.625rem] text-ink-500">
              <Clock className="h-3 w-3" />
              {dup ? "First check-in at " : "Recorded at "}
              {new Date(outcome.checkedInAt.replace(" ", "T") + "Z").toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {dup && (
              <p className="mt-1.5 rounded-md bg-white/70 px-2 py-1 text-[0.625rem] text-ink-600">
                No duplicate attendance record was created.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onReset}
            className="shrink-0 rounded-md px-2 py-1 text-[0.625rem] font-semibold text-ink-500 hover:bg-white/60 hover:text-ink-900"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const isWrongEvent = outcome.code === "wrong_event";
  return (
    <div role="alert" className="rounded-sm border border-flame-500/30 bg-flame-50 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xs bg-flame-500 text-white">
          <XCircle className="h-5 w-5" strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] font-bold text-flame-600">
            {outcome.code === "not_found"
              ? "Credential not recognised"
              : isWrongEvent
                ? "Wrong event"
                : outcome.code === "waitlisted"
                  ? "Waitlisted attendee"
                  : outcome.code === "cancelled"
                    ? "Registration cancelled"
                    : "Check-in refused"}
          </p>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-700">{outcome.error}</p>

          {outcome.registration && (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-white/70 px-2.5 py-1.5">
              <User className="h-3 w-3 shrink-0 text-ink-400" />
              <span className="text-[0.6875rem] text-ink-700">
                {outcome.registration.name} ·{" "}
                <span className="font-mono">{outcome.registration.reference}</span>
              </span>
            </div>
          )}

          <p className="mt-2 text-[0.625rem] leading-relaxed text-ink-500">
            {outcome.code === "not_found"
              ? "Check the reference on the attendee's pass, or send them to the manual desk."
              : isWrongEvent
                ? "This credential is valid for a different gathering. Direct the attendee to the correct venue."
                : "Refer this attendee to the registration desk for resolution."}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-md px-2 py-1 text-[0.625rem] font-semibold text-ink-500 hover:bg-white/60 hover:text-ink-900"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
