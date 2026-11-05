/** Locale-stable formatting for Lagos-time event display. */

const TZ = "Africa/Lagos";

export function eventDateParts(iso: string) {
  const d = new Date(iso);
  return {
    weekday: new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: TZ }).format(d),
    weekdayShort: new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: TZ }).format(d),
    day: new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: TZ }).format(d),
    dayNum: Number(new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: TZ }).format(d)),
    month: new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: TZ }).format(d),
    monthShort: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: TZ }).format(d).toUpperCase(),
    year: new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: TZ }).format(d),
    time: new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ })
      .format(d)
      .toUpperCase()
      .replace(/\s/g, ""),
  };
}

/** "Friday 13 November 2026 · 4:00PM" */
export function formatEventDate(iso: string): string {
  const p = eventDateParts(iso);
  return `${p.weekday} ${p.dayNum} ${p.month} ${p.year} · ${p.time}`;
}

/** "13 NOV" */
export function formatShortDate(iso: string): string {
  const p = eventDateParts(iso);
  return `${p.day} ${p.monthShort}`;
}

/** Compact timestamp for tables: "05 Nov · 14:32" */
export function formatStamp(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(d);
  return `${day} · ${time}`;
}

export function formatRelative(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatStamp(iso);
}

/** Days / hours / minutes until an ISO timestamp. */
export function countdownTo(iso: string) {
  const target = new Date(iso).getTime();
  const diff = Math.max(0, target - Date.now());
  return {
    expired: target <= Date.now(),
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

export function numberFormat(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** ICA-agnostic .ics payload for add-to-calendar links. */
export function buildIcs(v: {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  uid: string;
}): string {
  const dt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EPHAPHATA//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${v.uid}`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(v.start)}`,
    `DTEND:${dt(v.end)}`,
    `SUMMARY:${v.title}`,
    `DESCRIPTION:${v.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${v.location.replace(/\n/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
