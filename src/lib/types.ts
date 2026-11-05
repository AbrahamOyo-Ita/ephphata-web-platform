/** Shared row types - mirrors migrations/001_init.sqlite.sql */

export type EventStatus =
  | "draft"
  | "published"
  | "registration_closed"
  | "live"
  | "completed"
  | "archived";

export type EventRow = {
  id: string;
  org_id: string;
  slug: string;
  title: string;
  edition_label: string | null;
  theme: string | null;
  scripture: string | null;
  summary: string | null;
  description: string | null;
  status: EventStatus;
  is_featured: number;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  venue_name: string | null;
  venue_address: string | null;
  maps_url: string | null;
  poster_url: string | null;
  hero_bg: string;
  capacity: number | null;
  registration_open: number;
  volunteer_open: number;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type SpeakerRow = {
  id: string;
  event_id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
};

export type ScheduleRow = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  starts_at: string | null;
  duration_min: number;
  sort_order: number;
};

export type FaqRow = {
  id: string;
  event_id: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type RegistrationRow = {
  id: string;
  event_id: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  city: string | null;
  attendance_intent: "in_person" | "online" | "undecided";
  heard_via: string | null;
  communication_prefs: string | null;
  consent_privacy: number;
  consent_marketing: number;
  status: "confirmed" | "waitlisted" | "cancelled";
  source: "public" | "admin" | "import";
  qr_token: string;
  created_by: string | null;
  notes: string | null;
  confirmation_sent_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type RegistrationWithAttendance = RegistrationRow & {
  checked_in_at: string | null;
  event_title?: string;
  event_slug?: string;
};

export type DepartmentRow = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  is_open: number;
  sort_order: number;
};

export type VolunteerStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "waitlisted"
  | "declined";

export type VolunteerRow = {
  id: string;
  event_id: string;
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  department_id: string | null;
  second_choice_id: string | null;
  experience: string | null;
  availability: string | null;
  motivation: string | null;
  status: VolunteerStatus;
  internal_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  consent: number;
  created_at: string;
  updated_at: string;
  department_name?: string | null;
};

export type PrayerStatus = "received" | "in_prayer" | "follow_up" | "answered" | "archived";

export type PrayerRow = {
  id: string;
  event_id: string | null;
  reference: string;
  is_anonymous: number;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  request: string;
  category: string | null;
  status: PrayerStatus;
  allow_follow_up: number;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceRow = {
  id: string;
  event_id: string;
  registration_id: string;
  checked_in_at: string;
  method: "qr" | "manual" | "lookup";
  checked_in_by: string | null;
  gate: string | null;
};
