import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { EventForm } from "@/components/admin/EventForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New event" };

export default async function NewEventPage() {
  await requireUser("events.manage");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All events
        </Link>
        <h1 className="mt-3 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">New event</h1>
        <p className="mt-1.5 text-[0.8125rem] text-ink-500">
          New events start as drafts and are invisible on the public site until you publish them.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-sm border border-azure-600/20 bg-azure-500/[0.06] px-3.5 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azure-600" strokeWidth={2.2} />
        <p className="text-[0.6875rem] leading-relaxed text-ink-600">
          Only enter details you have confirmed. Dates, venues and speakers shown on the public site
          come directly from these fields - nothing is invented on the visitor&apos;s behalf.
        </p>
      </div>

      <EventForm />
    </div>
  );
}
