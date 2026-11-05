import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listEvents } from "@/lib/data/events";
import { ManualRegistrationForm } from "@/components/admin/ManualRegistrationForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Register attendee" };

export default async function NewRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const user = await requireUser("registrations.manage");
  const params = await searchParams;
  const events = listEvents({ includeAll: true }).map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          href="/admin/registrations"
          className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to registrations
        </Link>
        <h1 className="mt-3 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
          Register an attendee
        </h1>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-500">
          For walk-ins, phone registrations and anyone the desk registers on their behalf. The
          record is stamped with your name and marked as staff-registered.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-sm border border-azure-600/20 bg-azure-500/[0.06] px-3.5 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azure-600" strokeWidth={2.2} />
        <p className="text-[0.6875rem] leading-relaxed text-ink-600">
          Duplicate detection is identical to the public form - registering an email that already
          exists for this event will be refused and the existing reference shown.
        </p>
      </div>

      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5 sm:p-6">
        <ManualRegistrationForm
          events={events}
          defaultEventId={params.event ?? events[0]?.id ?? ""}
          actorName={user.fullName}
        />
      </div>
    </div>
  );
}
