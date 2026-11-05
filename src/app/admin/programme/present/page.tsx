import { getFeaturedEvent } from "@/lib/data/events";
import { getSchedule } from "@/lib/data/programme";
import { PresentScreen } from "@/components/admin/PresentScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Presentation screen", robots: { index: false } };

/**
 * Presentation screen - full-screen display for the confidence monitor or
 * projector. Server-loaded schedule, client-side live clock synced to the
 * controller via localStorage. Chrome-free by design.
 */
export default async function PresentPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const params = await searchParams;
  const event = getFeaturedEvent();
  if (!event) {
    return (
      <main className="grid min-h-dvh place-items-center bg-ink-900 text-white">
        <p className="text-sm text-white/50">No active event.</p>
      </main>
    );
  }

  const items = getSchedule(event.id);

  return (
    <PresentScreen
      eventId={event.id}
      eventTitle={event.title}
      items={items.map((i) => ({
        id: i.id,
        title: i.title,
        owner: i.owner,
        durationMinutes: i.durationMinutes,
      }))}
      requestedEventId={params.event}
    />
  );
}
