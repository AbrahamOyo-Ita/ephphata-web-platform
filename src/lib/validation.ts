import { z } from "zod";

/**
 * EPHAPHATA - shared validation
 * Used identically on the client (inline feedback) and on the server
 * (authoritative). Never trust the browser copy.
 */

const nameRule = z
  .string()
  .trim()
  .min(2, "Please enter at least 2 characters.")
  .max(60, "That name is too long.")
  .regex(/^[\p{L}\p{M}'’.\- ]+$/u, "Use letters, spaces, apostrophes or hyphens only.");

// Nigerian-friendly but international: accepts +234…, 0803…, 07…, with spaces/dashes
const phoneRule = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number.")
  .max(20, "That number is too long.")
  .regex(/^\+?[\d\s\-()]{7,20}$/, "Enter a valid phone number.")
  .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a valid phone number.");

const optionalPhone = z
  .string()
  .trim()
  .max(20)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined))
  .pipe(phoneRule.optional());

export const emailRule = z
  .string()
  .trim()
  .min(5, "Enter your email address.")
  .max(160, "That email is too long.")
  .email("Enter a valid email address, e.g. you@example.com")
  .transform((v) => v.toLowerCase());

const heardVia = z.enum([
  "social_media",
  "friend_or_family",
  "church",
  "flyer",
  "whatsapp",
  "radio_tv",
  "previous_edition",
  "other",
]);

/* ------------------------------------------------------------------ public */

export const registrationSchema = z.object({
  eventSlug: z.string().trim().min(1),
  firstName: nameRule,
  lastName: nameRule,
  email: emailRule,
  phone: phoneRule,
  whatsapp: optionalPhone,
  city: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v || undefined),
  attendanceIntent: z.enum(["in_person", "online", "undecided"]).default("in_person"),
  heardVia: heardVia.default("social_media"),
  commEmail: z.boolean().default(true),
  commWhatsapp: z.boolean().default(false),
  commNewsletter: z.boolean().default(false),
  consentPrivacy: z
    .boolean()
    .refine((v) => v === true, "Please accept the privacy notice to continue."),
  // Anti-spam honeypot: must stay empty. Bots fill it.
  honeypot: z.string().max(0, "Submission rejected.").optional().or(z.literal("")),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/* ---------------------------------------------------------------- volunteers */

export const AVAILABILITY_SLOTS = [
  { id: "setup", label: "Setup (morning)" },
  { id: "afternoon", label: "Afternoon" },
  { id: "event", label: "During the event" },
  { id: "teardown", label: "Teardown & follow-up" },
] as const;

export const volunteerSchema = z.object({
  eventSlug: z.string().trim().min(1),
  fullName: nameRule,
  email: emailRule,
  phone: phoneRule,
  whatsapp: optionalPhone,
  departmentId: z.string().trim().min(1, "Choose the department you would like to serve in."),
  secondChoiceId: z.string().trim().optional().or(z.literal("")).transform((v) => v || undefined),
  experience: z.string().trim().max(600).optional().or(z.literal("")).transform((v) => v || undefined),
  availability: z.array(z.string()).min(1, "Select at least one availability window."),
  motivation: z
    .string()
    .trim()
    .min(20, "Tell us a little more (at least 20 characters).")
    .max(900, "Please keep this under 900 characters."),
  consent: z.boolean().refine((v) => v === true, "Please confirm you agree to the volunteer terms."),
  honeypot: z.string().max(0).optional().or(z.literal("")),
});

export type VolunteerInput = z.infer<typeof volunteerSchema>;

/* ------------------------------------------------------------------- prayer */

export const prayerSchema = z.object({
  eventSlug: z.string().trim().optional().or(z.literal("")).transform((v) => v || undefined),
  isAnonymous: z.boolean().default(false),
  displayName: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v || undefined),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined)
    .pipe(emailRule.optional()),
  phone: optionalPhone,
  request: z
    .string()
    .trim()
    .min(15, "Please share a little more - at least 15 characters.")
    .max(3000, "Please keep your request under 3000 characters."),
  category: z
    .enum(["salvation", "healing", "family", "provision", "direction", "thanksgiving", "other"])
    .default("other"),
  allowFollowUp: z.boolean().default(false),
});

export type PrayerInput = z.infer<typeof prayerSchema>;

/* ------------------------------------------------------------------ contact */

export const contactSchema = z.object({
  name: nameRule,
  email: emailRule,
  subject: z.enum(["general", "event", "partnership", "volunteer", "media"]).default("general"),
  message: z.string().trim().min(15, "Please add a little more detail.").max(2000),
  honeypot: z.string().max(0).optional().or(z.literal("")),
});

/* ------------------------------------------------------------------- admin  */

export const adminRegistrationSchema = registrationSchema
  .omit({ honeypot: true, commNewsletter: true, eventSlug: true })
  .extend({
    eventId: z.string().trim().min(1, "Choose an event."),
    notes: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => v || undefined),
    status: z.enum(["confirmed", "waitlisted"]).default("confirmed"),
  });

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const checkinSchema = z.object({
  eventId: z.string().min(1),
  credential: z.string().trim().min(4, "Enter a reference or scan a QR code."),
  gate: z.string().trim().max(40).optional(),
});

export const volunteerReviewSchema = z.object({
  status: z.enum(["submitted", "under_review", "accepted", "waitlisted", "declined"]),
  departmentId: z.string().optional(),
  internalNotes: z.string().max(1000).optional(),
});

/* ------------------------------------------------------------------- helpers */

/** Flattens a ZodError into { field: message } for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Pretty-print a phone number for display: 08031234567 -> 0803 123 4567 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 13 && digits.startsWith("234")) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return raw;
}

/* ── Admin: events ───────────────────────────────────────────────────────── */

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Give the event a title.").max(120),
    slug: z
      .string()
      .trim()
      .min(3, "A URL slug is required.")
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
    theme: z.string().trim().max(140).optional().or(z.literal("")),
    description: z.string().trim().max(4000).optional().or(z.literal("")),
    startsAt: z.string().min(1, "A start time is required."),
    endsAt: z.string().optional().or(z.literal("")),
    venueName: z.string().trim().min(2, "A venue is required.").max(160),
    venueAddress: z.string().trim().max(240).optional().or(z.literal("")),
    capacity: z.coerce.number().int().min(0).max(1_000_000).default(0),
    status: z.enum(["draft", "published", "registration_closed", "live", "completed", "archived"]),
    registrationOpen: z.coerce.boolean().default(true),
  })
  .refine((v) => !v.endsAt || new Date(v.endsAt) > new Date(v.startsAt), {
    message: "The end time must be after the start time.",
    path: ["endsAt"],
  });

/* ── Admin: campaigns ────────────────────────────────────────────────────── */

export const campaignSchema = z.object({
  name: z.string().trim().min(3, "Give the campaign a name.").max(120),
  channel: z.enum(["email", "whatsapp"]),
  audience: z.enum(["event_registrants", "event_checked_in", "newsletter_subscribers", "volunteers_accepted"]),
  template: z.enum(["registration_confirmation", "event_reminder", "thank_you", "custom"]),
  subject: z.string().trim().min(3, "A subject is required.").max(160),
  body: z.string().trim().min(10, "Write the message body.").max(8000),
});

/* ── Admin: team ─────────────────────────────────────────────────────────── */

export const inviteMemberSchema = z.object({
  email: emailRule,
  fullName: z.string().trim().min(2, "Enter their full name.").max(120),
  phone: phoneRule.optional().or(z.literal("")),
  role: z.enum([
    "super_admin",
    "event_admin",
    "registration_officer",
    "volunteer_coordinator",
    "communications_manager",
    "content_editor",
    "prayer_team",
    "programme_manager",
    "check_in_officer",
    "viewer",
  ]),
});

export const teamUpdateSchema = z
  .object({
    id: z.string().min(1),
    role: z
      .enum([
        "super_admin",
        "event_admin",
        "registration_officer",
        "volunteer_coordinator",
        "communications_manager",
        "content_editor",
        "prayer_team",
        "programme_manager",
        "check_in_officer",
        "viewer",
      ])
      .optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((v) => v.role || v.status, { message: "Nothing to update." });
