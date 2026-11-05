"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, AlertCircle } from "lucide-react";

/** Newsletter opt-in. Explicit consent only - separate from event registration. */
export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");

    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setState("error");
        setMessage(json.error ?? "That didn't go through. Please try again.");
        return;
      }
      setState("done");
      setMessage("You're on the list. We'll be in touch when the next gathering is announced.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network problem - please check your connection and try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-start gap-3 rounded-md border border-emerald-300/40 bg-emerald-500/15 p-5">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-xs bg-emerald-500 text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <p className="text-[0.875rem] leading-relaxed text-white/90">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="newsletter-email" className="mb-2 block text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white/50">
        Email address
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="you@example.com"
          aria-invalid={state === "error"}
          className="w-full rounded-xs border border-white/25 bg-white/10 px-5 py-3.5 text-[0.9375rem] text-white placeholder:text-white/40 transition-colors focus:border-white focus:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/15"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xs bg-white px-6 py-3.5 text-[0.875rem] font-semibold text-ink-900 transition-colors duration-300 hover:bg-white/90 disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Subscribe
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[0.75rem] font-medium text-gold-300" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {message}
        </p>
      )}
      <p className="mt-3 text-[0.6875rem] leading-relaxed text-white/40">
        We will never share your details. Unsubscribe any time.
      </p>
    </form>
  );
}
