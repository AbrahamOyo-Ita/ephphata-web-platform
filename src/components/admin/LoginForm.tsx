"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowRight, Eye, EyeOff, ChevronDown, Info } from "lucide-react";
import type { DemoAccount } from "@/lib/demo";

export function LoginForm({ demoAccounts }: { demoAccounts: DemoAccount[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Sign in failed. Check your details and try again.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Network problem - check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function useDemo(account: DemoAccount) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-sm border border-danger/25 bg-danger/[0.06] p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2.2} />
            <p className="text-[0.8125rem] font-medium leading-relaxed text-ink-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="field-label">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@ephaphata.com"
            className="input"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-[0.8125rem] font-semibold text-ink-800">
              Password
            </label>
            <span
              className="cursor-help text-[0.6875rem] font-medium text-ink-400"
              title="Password recovery is handled by a super admin. Email delivery for self-service reset is not configured in this release."
            >
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-ink-900/5 hover:text-ink-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-ink w-full group">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Demo credential disclosure - deliberately explicit */}
      <div className="mt-7 rounded-sm border border-ink-900/10 bg-white">
        <button
          type="button"
          onClick={() => setShowDemo((s) => !s)}
          aria-expanded={showDemo}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
            <span className="text-[0.75rem] font-semibold text-ink-700">
              Demonstration accounts
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300 ${showDemo ? "rotate-180" : ""}`}
          />
        </button>

        {showDemo && (
          <div className="border-t border-ink-900/[0.07] p-3">
            <p className="mb-2.5 px-1 text-[0.6875rem] leading-relaxed text-ink-400">
              Seeded test accounts for this demonstration build. Not present in production.
              Tap one to fill the form.
            </p>
            <div className="space-y-1.5">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => useDemo(account)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xs border border-ink-900/[0.07] px-3 py-2.5 text-left transition-colors hover:border-ink-900/20 hover:bg-paper-50"
                >
                  <span className="min-w-0">
                    <span className="block text-[0.75rem] font-semibold text-ink-900">
                      {account.role}
                    </span>
                    <span className="block truncate text-[0.625rem] text-ink-400">
                      {account.label}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.625rem] font-medium text-ink-500 opacity-0 transition-opacity group-hover:opacity-100">
                    Use →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-[0.6875rem] text-ink-400">
        <Link href="/" className="font-medium text-ink-600 underline underline-offset-2 hover:text-ink-900">
          Return to the public site
        </Link>
      </p>
    </>
  );
}
