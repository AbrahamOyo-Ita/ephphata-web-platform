import { redirect } from "next/navigation";
import { getFeaturedEvent } from "@/lib/data/events";

/** Canonical registration entry point used by the global navigation and footer. */
export default function RegisterEntryPage() {
  const event = getFeaturedEvent();
  redirect(event ? `/events/${event.slug}/register` : "/events");
}
