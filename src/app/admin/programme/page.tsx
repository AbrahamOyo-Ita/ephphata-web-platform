import Link from "next/link";
import { Radio, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getFeaturedEvent } from "@/lib/data/events";
import { getSchedule } from "@/lib/data/programme";
import { EmptyState } from "@/components/admin/EmptyState";
import { ProgrammeController } from "@/components/admin/ProgrammeController";
import { DemoBanner } from "@/components/admin/DemoBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Programme" };

export default async function ProgrammePage() {
  const user = await requireUser("programme.view");
  const event = getFeaturedEvent();

  if (!event) {
    return (
      <EmptyState
        icon={Radio}
        title="No active event"
        description="The programme controller runs against a specific event."
        action={{ label: "Manage events", href: "/admin/events" }}
      />
    );
  }

  const items = getSchedule(event.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Programme
          </p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
            Run of show
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            {event.title} · {items.length} segments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <DemoBanner compact />
          <Link
            href={`/admin/programme/present?event=${event.id}`}
            target="_blank"
            rel="noopener"
            className="btn-outline btn-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open presentation screen
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No programme yet"
          description="Add schedule segments to the event before running the timer."
          action={{ label: "Edit event", href: `/admin/events/${event.id}` }}
        />
      ) : (
        <ProgrammeController
          eventId={event.id}
          eventTitle={event.title}
          items={items.map((i) => ({
            id: i.id,
            title: i.title,
            kind: i.kind,
            startsAt: i.startsAt,
            durationMinutes: i.durationMinutes,
            owner: i.owner,
            notes: i.notes,
          }))}
          canManage={can(user.role, "programme.manage")}
        />
      )}
    </div>
  );
}
