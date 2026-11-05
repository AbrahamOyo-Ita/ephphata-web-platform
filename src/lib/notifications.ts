import "server-only";
import { db } from "./db";
import { uuid } from "./ids";

/**
 * Notification dispatch.
 * ------------------------------------------------------------------
 * HARD RULE: this module never reports success for a message it did not
 * actually hand to a provider. When no provider credentials are configured it
 * returns `not_configured`, which the UI surfaces honestly
 * ("Your registration is saved - confirmation email is not configured yet").
 *
 * To enable email: set RESEND_API_KEY + EMAIL_FROM in the environment.
 * To enable WhatsApp: set WHATSAPP_PROVIDER + WHATSAPP_TOKEN + WHATSAPP_SENDER.
 *
 * Every attempt - successful, failed or skipped - is written to
 * notification_logs for the communications dashboard.
 */

export type DispatchResult = {
  status: "sent" | "failed" | "not_configured";
  provider: string | null;
  detail?: string;
};

type LogInput = {
  channel: "email" | "whatsapp";
  recipient: string;
  template: string;
  status: string;
  provider?: string | null;
  providerRef?: string | null;
  error?: string | null;
  relatedType?: string;
  relatedId?: string;
};

function log(input: LogInput): void {
  db.prepare(
    `INSERT INTO notification_logs
       (id, channel, recipient, template, status, provider, provider_ref, error, related_type, related_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uuid(),
    input.channel,
    input.recipient,
    input.template,
    input.status,
    input.provider ?? null,
    input.providerRef ?? null,
    input.error ?? null,
    input.relatedType ?? null,
    input.relatedId ?? null
  );
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_SENDER);
}

type EmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  relatedType?: string;
  relatedId?: string;
};

export async function sendEmail(args: EmailArgs): Promise<DispatchResult> {
  if (!emailConfigured()) {
    log({
      channel: "email",
      recipient: args.to,
      template: args.template,
      status: "not_configured",
      error: "RESEND_API_KEY / EMAIL_FROM not set",
      relatedType: args.relatedType,
      relatedId: args.relatedId,
    });
    return { status: "not_configured", provider: null, detail: "Email provider not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      log({
        channel: "email",
        recipient: args.to,
        template: args.template,
        status: "failed",
        provider: "resend",
        error: `${res.status} ${body.slice(0, 300)}`,
        relatedType: args.relatedType,
        relatedId: args.relatedId,
      });
      return { status: "failed", provider: "resend", detail: `Provider returned ${res.status}` };
    }

    const json = (await res.json().catch(() => ({}))) as { id?: string };
    log({
      channel: "email",
      recipient: args.to,
      template: args.template,
      status: "sent",
      provider: "resend",
      providerRef: json.id ?? null,
      relatedType: args.relatedType,
      relatedId: args.relatedId,
    });
    return { status: "sent", provider: "resend" };
  } catch (err) {
    log({
      channel: "email",
      recipient: args.to,
      template: args.template,
      status: "failed",
      provider: "resend",
      error: String(err).slice(0, 300),
      relatedType: args.relatedType,
      relatedId: args.relatedId,
    });
    return { status: "failed", provider: "resend", detail: "Network error" };
  }
}

type WhatsAppArgs = {
  to: string;
  template: string;
  params: string[];
  relatedType?: string;
  relatedId?: string;
};

export async function sendWhatsApp(args: WhatsAppArgs): Promise<DispatchResult> {
  if (!whatsappConfigured()) {
    log({
      channel: "whatsapp",
      recipient: args.to,
      template: args.template,
      status: "not_configured",
      error: "WhatsApp provider not configured",
      relatedType: args.relatedType,
      relatedId: args.relatedId,
    });
    return { status: "not_configured", provider: null, detail: "WhatsApp provider not configured" };
  }
  // Scaffolded: real dispatch requires an approved Meta Business template.
  log({
    channel: "whatsapp",
    recipient: args.to,
    template: args.template,
    status: "failed",
    provider: process.env.WHATSAPP_PROVIDER ?? "meta_cloud",
    error: "Template dispatch not implemented in this release",
    relatedType: args.relatedType,
    relatedId: args.relatedId,
  });
  return {
    status: "failed",
    provider: process.env.WHATSAPP_PROVIDER ?? "meta_cloud",
    detail: "WhatsApp template dispatch pending provider approval",
  };
}

/* ------------------------------------------------------- message composition */

const br = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

export function registrationEmail(v: {
  firstName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  reference: string;
  checkinUrl: string;
}) {
  const subject = `You're registered for ${v.eventTitle}`;
  const text = [
    `Hi ${v.firstName},`,
    ``,
    `Your place at ${v.eventTitle} is confirmed.`,
    ``,
    `Reference: ${v.reference}`,
    `Date: ${v.eventDate}`,
    `Venue: ${v.venue}`,
    ``,
    `Show this reference (or the QR code on your confirmation page) at the check-in desk.`,
    `Manage your confirmation: ${v.checkinUrl}`,
    ``,
    `EPHAPHATA with OT Power & The Attackers`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#F5F4F0;font-family:Inter,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#111;color:#fff;border-radius:20px 20px 0 0;padding:28px 28px 24px">
      <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.7">Ephphata</div>
      <div style="font-size:30px;line-height:1;margin-top:10px;font-weight:800;letter-spacing:-.02em;text-transform:uppercase">You're in.</div>
    </div>
    <div style="background:#fff;border-radius:0 0 20px 20px;padding:28px">
      <p style="margin:0 0 14px">Hi ${br(v.firstName)},</p>
      <p style="margin:0 0 22px;color:#3D3D3D">Your place at <strong>${br(v.eventTitle)}</strong> is confirmed. We can't wait to worship with you.</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:10px 0;color:#8A8A8A">Reference</td><td style="padding:10px 0;text-align:right;font-weight:700;font-family:monospace;font-size:15px">${br(v.reference)}</td></tr>
        <tr><td style="padding:10px 0;color:#8A8A8A;border-top:1px solid #eee">Date</td><td style="padding:10px 0;text-align:right;border-top:1px solid #eee">${br(v.eventDate)}</td></tr>
        <tr><td style="padding:10px 0;color:#8A8A8A;border-top:1px solid #eee">Venue</td><td style="padding:10px 0;text-align:right;border-top:1px solid #eee">${br(v.venue)}</td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#5C5C5C">Present this reference, or the QR code on your confirmation page, at the check-in desk.</p>
      <a href="${v.checkinUrl}" style="display:inline-block;margin-top:22px;background:#111;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-size:14px;font-weight:600">View my confirmation</a>
    </div>
    <p style="text-align:center;color:#8A8A8A;font-size:12px;margin-top:22px">EPHAPHATA with OT Power &amp; The Attackers</p>
  </div></body></html>`;

  return { subject, text, html };
}

export function volunteerEmail(v: { fullName: string; reference: string; eventTitle: string }) {
  const subject = `We received your volunteer application - ${v.reference}`;
  const text = [
    `Hi ${v.fullName},`,
    ``,
    `Thank you for offering to serve at ${v.eventTitle}.`,
    `Your application reference is ${v.reference}. Our volunteer coordination team will review it and reach out.`,
    ``,
    `EPHAPHATA with OT Power & The Attackers`,
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:Inter,Helvetica,Arial,sans-serif;color:#111;background:#F5F4F0;margin:0">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <div style="background:#fff;border-radius:20px;padding:30px">
        <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#01805C;font-weight:700">Volunteer application</div>
        <h1 style="font-size:26px;margin:12px 0 16px;letter-spacing:-.02em">Thank you, ${br(v.fullName)}.</h1>
        <p style="color:#3D3D3D;margin:0 0 18px">We received your application to serve at <strong>${br(v.eventTitle)}</strong>. Our coordination team reviews every application personally.</p>
        <p style="margin:0;font-size:14px;color:#5C5C5C">Reference: <strong style="font-family:monospace">${br(v.reference)}</strong></p>
      </div>
      <p style="text-align:center;color:#8A8A8A;font-size:12px;margin-top:22px">EPHAPHATA</p>
    </div></body></html>`;
  return { subject, text, html };
}

/** Recent notification activity, for the comms dashboard. */
export function notificationSummary() {
  const rows = db
    .prepare(
      `SELECT status, count(*) AS n FROM notification_logs
        GROUP BY status`
    )
    .all() as { status: string; n: number }[];
  const recent = db
    .prepare(
      `SELECT id, channel, recipient, template, status, error, created_at
         FROM notification_logs ORDER BY created_at DESC LIMIT 12`
    )
    .all() as {
    id: string;
    channel: string;
    recipient: string;
    template: string;
    status: string;
    error: string | null;
    created_at: string;
  }[];
  return { byStatus: Object.fromEntries(rows.map((r) => [r.status, r.n])), recent };
}
