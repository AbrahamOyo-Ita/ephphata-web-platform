import "server-only";
import { db } from "../db";

export type AdminRegistration = {
  id: string;
  event_id: string;
  event_title: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  city: string | null;
  status: string;
  source: string;
  attendance_intent: string;
  heard_via: string | null;
  /** Raw JSON: {"email":bool,"whatsapp":bool,"newsletter":bool} */
  communication_prefs: string | null;
  comm_email: boolean;
  comm_whatsapp: boolean;
  comm_newsletter: boolean;
  notes: string | null;
  created_at: string;
  checked_in_at: string | null;
  checkin_method: string | null;
  checkin_gate: string | null;
};

/** Decodes the stored communication preference JSON, tolerating junk. */
function decodePrefs(raw: string | null): { email: boolean; whatsapp: boolean; newsletter: boolean } {
  try {
    const parsed = JSON.parse(raw ?? "{}") as Record<string, unknown>;
    return { email: Boolean(parsed.email), whatsapp: Boolean(parsed.whatsapp), newsletter: Boolean(parsed.newsletter) };
  } catch {
    return { email: false, whatsapp: false, newsletter: false };
  }
}

type AdminRegistrationRow = Omit<AdminRegistration, "comm_email" | "comm_whatsapp" | "comm_newsletter"> & {
  communication_prefs: string | null;
};

export function getRegistrationForAdmin(id: string): AdminRegistration | null {
  const row: AdminRegistrationRow | undefined = db
    .prepare(
      `SELECT r.id, r.event_id, e.title AS event_title, r.reference,
              r.first_name, r.last_name, r.email, r.phone, r.whatsapp, r.city,
              r.status, r.source, r.attendance_intent, r.heard_via,
              r.communication_prefs, r.notes, r.created_at,
              a.checked_in_at, a.method AS checkin_method, a.gate AS checkin_gate
         FROM registrations r
         JOIN events e ON e.id = r.event_id
         LEFT JOIN attendance_records a ON a.registration_id = r.id
        WHERE r.id = ? AND r.deleted_at IS NULL`
    )
    .get(id) as AdminRegistrationRow | undefined;

  if (!row) return null;
  const prefs = decodePrefs(row.communication_prefs);
  return { ...row, comm_email: prefs.email, comm_whatsapp: prefs.whatsapp, comm_newsletter: prefs.newsletter };
}
