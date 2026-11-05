import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "No access",
  robots: { index: false, follow: false },
};

/**
 * Shown when a signed-in account opens a page its role cannot use.
 * Rendered inside the admin shell so the person can navigate straight to a
 * page they do have access to instead of hitting a bare 404.
 */
export default async function ForbiddenPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto max-w-xl py-10">
      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-8">
        <span className="grid h-10 w-10 place-items-center rounded-xs bg-flame-50 text-flame-900">
          <ShieldAlert className="h-5 w-5" strokeWidth={2.2} />
        </span>

        <h1 className="mt-5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
          You do not have access to that page
        </h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-500">
          {user
            ? `Your account (${user.email}) is signed in as ${user.role.replace(/_/g, " ")}. Ask a super admin if you need this area opened up.`
            : "Sign in with an account that has permission for this area."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-xs bg-ink-900 px-3.5 py-2 text-[0.8125rem] font-medium text-white hover:bg-ink-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
            Back to the dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-xs border border-ink-900/[0.12] px-3.5 py-2 text-[0.8125rem] font-medium text-ink-700 hover:bg-paper-50"
          >
            Public site
          </Link>
        </div>
      </div>
    </div>
  );
}
