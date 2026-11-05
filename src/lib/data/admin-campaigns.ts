import "server-only";
import { db } from "../db";
import { uuid } from "../ids";

export type CampaignInput = {
  name: string;
  channel: "email" | "whatsapp";
  audience: "event_registrants" | "event_checked_in" | "newsletter_subscribers" | "volunteers_accepted";
  template: string;
  subject: string;
  body: string;
};

type Result = { ok: true; id: string; queued: number } | { ok: false; message: string };

/**
 * Resolve an audience descriptor to the people actually eligible for it.
 * Eligibility is enforced in SQL so a UI mistake can never widen the audience.
 */
function resolveAudience(
  audience: CampaignInput["audience"],
  channel: "email" | "whatsapp",
  eventId: string | null
): { email: string | null; phone: string | null }[] {
  if (audience === "newsletter_subscribers") {
    // Marketing consent is tied to the contact record, never inferred from a
    // past event registration.
    return db
      .prepare(
        `SELECT a.email, a.phone
           FROM audience_contacts a
          WHERE a.subscribed = 1
            AND EXISTS (
              SELECT 1 FROM consent_records c
               WHERE c.contact_id = a.id
                 AND c.purpose IN ('newsletter','marketing_email')
                 AND c.granted = 1
            )
            ${channel === "whatsapp" ? "AND a.phone IS NOT NULL" : "AND a.email IS NOT NULL"}`
      )
      .all() as { email: string | null; phone: string | null }[];
  }

  if (!eventId) return [];

  const checkedInClause =
    audience === "event_checked_in"
      ? "AND EXISTS (SELECT 1 FROM attendance_records ar WHERE ar.registration_id = r.id)"
      : "";

  if (audience === "event_registrants" || audience === "event_checked_in") {
    return db
      .prepare(
        `SELECT r.email, r.phone
           FROM registrations r
          WHERE r.event_id = ? AND r.deleted_at IS NULL AND r.status = 'confirmed'
            ${checkedInClause}
            ${channel === "whatsapp" ? "AND r.phone IS NOT NULL" : "AND r.email IS NOT NULL"}`
      )
      .all(eventId) as { email: string | null; phone: string | null }[];
  }

  return db
    .prepare(
      `SELECT email, phone FROM volunteer_applications
        WHERE event_id = ? AND status = 'accepted'
          ${channel === "whatsapp" ? "AND phone IS NOT NULL" : "AND email IS NOT NULL"}`
    )
    .all(eventId) as { email: string | null; phone: string | null }[];
}

/**
 * Resolve the composer's template key to a stored message template.
 * Matching is by name and channel; unknown keys fall back to null so a
 * campaign can still be stored with its inline subject/body.
 */
const TEMPLATE_NAMES: Record<string, string> = {
  registration_confirmation: "Registration confirmation",
  event_reminder: "48-hour reminder",
  thank_you: "Thank you for attending",
};

function templateId(key: string, channel: "email" | "whatsapp"): string | null {
  const name = TEMPLATE_NAMES[key];
  if (!name) return null;
  const row = db
    .prepare(`SELECT id FROM message_templates WHERE name = ? AND channel = ? LIMIT 1`)
    .get(name, channel) as { id: string } | undefined;
  return row?.id ?? null;
}

export function createCampaign(input: CampaignInput, actorId: string): Result {
  const event = db
    .prepare(
      `SELECT id, title FROM events
        WHERE status IN ('published','live','registration_closed')
        ORDER BY starts_at DESC LIMIT 1`
    )
    .get() as { id: string; title: string } | undefined;

  const recipients = resolveAudience(input.audience, input.channel, event?.id ?? null);
  if (recipients.length === 0) {
    return {
      ok: false,
      message: "That audience currently has no eligible recipients for this channel.",
    };
  }

  const id = uuid();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO campaigns
        (id, event_id, name, channel, template_id, subject, body, audience,
         status, recipient_count, created_by)
       VALUES (?,?,?,?,?,?,?,?, 'draft', ?, ?)`
    ).run(
      id,
      event?.id ?? null,
      input.name,
      input.channel,
      templateId(input.template, input.channel),
      input.subject,
      input.body,
      input.audience,
      recipients.length,
      actorId
    );

    const insert = db.prepare(
      `INSERT INTO campaign_recipients (id, campaign_id, email, phone, status)
       VALUES (?,?,?,?, 'pending')`
    );
    for (const r of recipients) {
      insert.run(uuid(), id, r.email, r.phone);
    }
  });
  tx();

  return { ok: true, id, queued: recipients.length };
}
