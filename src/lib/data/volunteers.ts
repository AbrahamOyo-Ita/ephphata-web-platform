import "server-only";
import { db } from "../db";
import { uuid, volunteerReference } from "../ids";
import type { VolunteerRow, VolunteerStatus } from "../types";
import type { VolunteerInput } from "../validation";

export type VolunteerCreateResult =
  | { ok: true; id: string; reference: string }
  | { ok: false; reason: "duplicate" | "error"; message: string };

export function createVolunteerApplication(
  input: VolunteerInput,
  eventId: string
): VolunteerCreateResult {
  const email = input.email.trim().toLowerCase();

  const dup = db
    .prepare("SELECT reference FROM volunteer_applications WHERE event_id = ? AND lower(email) = ?")
    .get(eventId, email) as { reference: string } | undefined;

  if (dup) {
    return {
      ok: false,
      reason: "duplicate",
      message: `You have already applied to serve at this gathering (${dup.reference}).`,
    };
  }

  const id = uuid();
  const reference = volunteerReference();

  try {
    db.prepare(
      `INSERT INTO volunteer_applications
        (id, event_id, reference, full_name, email, phone, whatsapp, department_id,
         second_choice_id, experience, availability, motivation, consent)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      eventId,
      reference,
      input.fullName.trim(),
      email,
      input.phone.trim(),
      input.whatsapp?.trim() ?? null,
      input.departmentId,
      input.secondChoiceId ?? null,
      input.experience ?? null,
      JSON.stringify(input.availability),
      input.motivation.trim(),
      input.consent ? 1 : 0
    );
  } catch (err) {
    console.error("[volunteers.create]", err);
    return { ok: false, reason: "error", message: "We could not save your application. Please try again." };
  }

  return { ok: true, id, reference };
}

export function listVolunteers(params: {
  eventId?: string;
  status?: VolunteerStatus | "";
  departmentId?: string;
  search?: string;
}): VolunteerRow[] {
  const where: string[] = ["1=1"];
  const args: unknown[] = [];

  if (params.eventId) {
    where.push("v.event_id = ?");
    args.push(params.eventId);
  }
  if (params.status) {
    where.push("v.status = ?");
    args.push(params.status);
  }
  if (params.departmentId) {
    where.push("(v.department_id = ? OR v.second_choice_id = ?)");
    args.push(params.departmentId, params.departmentId);
  }
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push("(v.full_name LIKE ? OR v.email LIKE ? OR v.reference LIKE ? OR v.phone LIKE ?)");
    args.push(q, q, q, q);
  }

  return db
    .prepare(
      `SELECT v.*, d.name AS department_name
         FROM volunteer_applications v
         LEFT JOIN volunteer_departments d ON d.id = v.department_id
        WHERE ${where.join(" AND ")}
        ORDER BY
          CASE v.status
            WHEN 'submitted' THEN 0 WHEN 'under_review' THEN 1
            WHEN 'accepted' THEN 2 WHEN 'waitlisted' THEN 3 ELSE 4 END,
          v.created_at DESC`
    )
    .all(...args) as VolunteerRow[];
}

export function getVolunteer(id: string): VolunteerRow | null {
  return (
    (db
      .prepare(
        `SELECT v.*, d.name AS department_name FROM volunteer_applications v
           LEFT JOIN volunteer_departments d ON d.id = v.department_id
          WHERE v.id = ?`
      )
      .get(id) as VolunteerRow) ?? null
  );
}

export function reviewVolunteer(
  id: string,
  patch: { status: VolunteerStatus; departmentId?: string; internalNotes?: string },
  actorId: string
): boolean {
  const sets = ["status = ?", "reviewed_by = ?", "reviewed_at = datetime('now')", "updated_at = datetime('now')"];
  const args: unknown[] = [patch.status, actorId];
  if (patch.departmentId) {
    sets.push("department_id = ?");
    args.push(patch.departmentId);
  }
  if (patch.internalNotes !== undefined) {
    sets.push("internal_notes = ?");
    args.push(patch.internalNotes);
  }
  const res = db
    .prepare(`UPDATE volunteer_applications SET ${sets.join(", ")} WHERE id = ?`)
    .run(...args, id);
  return res.changes > 0;
}

export function volunteerStats(eventId?: string) {
  const scope = eventId ? "WHERE event_id = ?" : "";
  const args = eventId ? [eventId] : [];
  const rows = db
    .prepare(`SELECT status, count(*) AS n FROM volunteer_applications ${scope} GROUP BY status`)
    .all(...args) as { status: VolunteerStatus; n: number }[];
  const map = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>;
  return {
    submitted: map.submitted ?? 0,
    under_review: map.under_review ?? 0,
    accepted: map.accepted ?? 0,
    waitlisted: map.waitlisted ?? 0,
    declined: map.declined ?? 0,
    total: rows.reduce((a, r) => a + r.n, 0),
    pending: (map.submitted ?? 0) + (map.under_review ?? 0),
  };
}

export function departmentLoad(eventId: string) {
  return db
    .prepare(
      `SELECT d.id, d.name, d.capacity,
              (SELECT count(*) FROM volunteer_applications v
                WHERE v.department_id = d.id AND v.status IN ('accepted','submitted','under_review')) AS applicants,
              (SELECT count(*) FROM volunteer_applications v
                WHERE v.department_id = d.id AND v.status = 'accepted') AS accepted
         FROM volunteer_departments d
        WHERE d.event_id = ?
        ORDER BY d.sort_order`
    )
    .all(eventId) as { id: string; name: string; capacity: number | null; applicants: number; accepted: number }[];
}
