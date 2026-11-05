import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { BrandBG } from "@/components/brand/BrandBG";
import { DEMO_ACCOUNTS, DEMO_MODE } from "@/lib/demo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organiser login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel - the blue asset as a top band, then flat navy carrying the type */}
      <div className="relative hidden lg:block">
        <BrandBG family="blue" overlay priority className="absolute inset-0 h-full w-full" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xs bg-white text-ink-900">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M4 12a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M20 12a8 8 0 0 1-16 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity=".45" />
                <circle cx="12" cy="12" r="2.2" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-lg tracking-wide">EPHAPHATA</span>
          </Link>

          <div>
            <p className="label-xs text-white/50">Operations dashboard</p>
            <h1 className="mt-4 max-w-md font-display text-[clamp(2rem,3.6vw,3.2rem)] uppercase leading-[1.06] text-white">
              EVERY REGISTRATION. EVERY DEPARTMENT. ONE DESK.
            </h1>
            <p className="mt-5 max-w-sm text-[0.875rem] leading-relaxed text-white/65">
              Registration, check-in, volunteers, prayer follow-up, communications and programme
              timing - in one place, on the day it matters.
            </p>
          </div>

          <p className="text-[0.6875rem] text-white/45">
            Authorised staff only. All activity is logged.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-paper-50 px-5 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 transition-colors hover:text-ink-900 lg:hidden"
          >
            ← Back to site
          </Link>

          <div className="lg:hidden">
            <span className="text-2xl font-semibold tracking-[-0.01em] text-ink-900">EPHAPHATA</span>
          </div>

          <h2 className="mt-0 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900 lg:mt-0">
            Organiser sign in
          </h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-500">
            Use the credentials issued by your super admin. Accounts are created by invitation
            only - there is no public sign-up.
          </p>

          <div className="mt-8">
            <LoginForm demoAccounts={DEMO_MODE ? DEMO_ACCOUNTS : []} />
          </div>

          <p className="mt-8 border-t border-ink-900/10 pt-6 text-[0.6875rem] leading-relaxed text-ink-400">
            Trouble signing in? Contact a super admin to reset your access. Sessions expire after
            8 hours of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
}
