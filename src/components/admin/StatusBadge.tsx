/**
 * Status tones, restrained.
 * A flat tint plus a hairline outline - no shadows, no glows. Colour is used
 * only to separate states, never as decoration.
 */
const TONES = {
  neutral: "bg-ink-900/[0.06] text-ink-600",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-ink-900/[0.06] text-ink-700",
  azure: "bg-azure-500/10 text-azure-900",
  magenta: "bg-magenta-500/10 text-magenta-700",
  amber: "bg-gold-500/15 text-gold-700",
  flame: "bg-flame-50 text-flame-600",
} as const;

export type Tone = keyof typeof TONES;

export function StatusBadge({
  tone = "neutral",
  label,
  dot = true,
}: {
  tone?: Tone;
  label: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs px-2 py-0.5 text-[0.625rem] font-semibold capitalize ${TONES[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-xs bg-current opacity-70" />}
      {label}
    </span>
  );
}

/** Maps domain statuses to the right tone, consistently across screens. */
export const STATUS_TONES: Record<string, Tone> = {
  confirmed: "emerald",
  waitlisted: "amber",
  cancelled: "flame",
  submitted: "azure",
  under_review: "violet",
  accepted: "emerald",
  declined: "flame",
  received: "azure",
  in_prayer: "violet",
  follow_up: "amber",
  answered: "emerald",
  archived: "neutral",
  draft: "neutral",
  scheduled: "azure",
  sending: "violet",
  sent: "emerald",
  failed: "flame",
  published: "emerald",
  completed: "neutral",
  live: "flame",
  registration_closed: "amber",
};

export const STATUS_LABELS: Record<string, string> = {
  under_review: "Under review",
  in_prayer: "In prayer",
  follow_up: "Follow-up",
  registration_closed: "Reg. closed",
  not_configured: "Not configured",
};
