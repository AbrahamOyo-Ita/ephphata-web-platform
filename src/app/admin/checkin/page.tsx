import { QrCode } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getFeaturedEvent, listEvents } from "@/lib/data/events";
import { attendanceStats } from "@/lib/data/attendance";
import { CheckinConsole } from "@/components/admin/CheckinConsole";
import { EmptyState } from "@/components/admin/EmptyState";
import { DemoBanner } from "@/components/admin/DemoBanner";

export const dynamic = "force-dynamic";

export const metadata = { title: "Check-in" };

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const user = await requireUser("checkin.operate");
  const params = await searchParams;

  const events = listEvents({ includeAll: true });
  const featured = getFeaturedEvent();
  const event = params.event
    ? events.find((e) => e.id === params.event) ?? featured
    : featured;

  if (!event) {
    return (
      <EmptyState
        icon={QrCode}
        title="No event to check in"
        description="Create and publish an event before opening the attendance desk."
        action={{ label: "Manage events", href: "/admin/events" }}
      />
    );
  }

  const stats = attendanceStats(event.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Attendance desk
          </p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
            Check-in
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            {event.title} · {stats.checkedIn} of {stats.total} arrived ({stats.rate}%)
          </p>
        </div>
        <DemoBanner compact />
      </div>

      <CheckinConsole
        events={events.map((e) => ({ id: e.id, title: e.title }))}
        eventId={event.id}
        initialStats={stats}
      />
    </div>
  );
}
