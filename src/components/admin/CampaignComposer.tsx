"use client";

import { useState } from "react";
import { Loader2, Send, AlertCircle, Check, Info } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

const AUDIENCES = [
  { value: "event_registrants", label: "Event registrants (confirmed)" },
  { value: "event_checked_in", label: "Checked-in attendees" },
  { value: "newsletter_subscribers", label: "Newsletter subscribers (consented only)" },
  { value: "volunteers_accepted", label: "Accepted volunteers" },
];

const TEMPLATES = [
  { value: "registration_confirmation", label: "Registration confirmation" },
  { value: "event_reminder", label: "Event reminder" },
  { value: "thank_you", label: "Thank you / follow-up" },
  { value: "custom", label: "Custom message" },
];

/**
 * Campaign composer.
 * Deliberately refuses to send when a provider is missing - it explains why
 * instead of pretending to deliver.
 */
export function CampaignComposer({
  emailReady,
  whatsappReady,
  canManage,
}: {
  emailReady: boolean;
  whatsappReady: boolean;
  canManage: boolean;
}) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [audience, setAudience] = useState("event_registrants");
  const [template, setTemplate] = useState("event_reminder");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ queued: number } | null>(null);

  const ready = channel === "email" ? emailReady : whatsappReady;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, channel, audience, template, subject, body }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; queued?: number };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not create the campaign.");
        return;
      }
      setResult({ queued: json.queued ?? 0 });
      setName("");
      setSubject("");
      setBody("");
    } catch {
      setError("Network problem - please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
        <p className="text-[0.75rem] leading-relaxed text-ink-500">
          You have read-only access to communications. A communications manager can compose and
          send campaigns.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
      <h2 className="text-[0.8125rem] font-semibold text-ink-900">Compose a campaign</h2>

      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xs border border-danger/25 bg-danger/[0.06] p-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.4} />
          <p className="text-[0.75rem] text-ink-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-3 flex items-start gap-2 rounded-xs border border-emerald-300/60 bg-emerald-50 p-2.5">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" strokeWidth={3} />
          <div>
            <p className="text-[0.75rem] font-medium text-ink-900">Campaign queued</p>
            <p className="text-[0.6875rem] text-ink-600">
              {result.queued} recipient{result.queued === 1 ? "" : "s"} queued. Delivery is handled by
              the provider - check the history for counts.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="name" className="field-label">Campaign name <span className="font-normal text-ink-400">(internal)</span></label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="input" required placeholder="Nov 12 - final reminder" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="channel" className="field-label">Channel</label>
            <CustomSelect
              id="channel"
              value={channel}
              onChange={(value) => setChannel(value as "email" | "whatsapp")}
              options={[{ value: "email", label: "Email" }, { value: "whatsapp", label: "WhatsApp" }]}
            />
          </div>
          <div>
            <label htmlFor="template" className="field-label">Template</label>
            <CustomSelect id="template" value={template} onChange={setTemplate} options={TEMPLATES} />
          </div>
        </div>

        <div>
          <label htmlFor="audience" className="field-label">Audience</label>
          <CustomSelect id="audience" value={audience} onChange={setAudience} options={AUDIENCES} />
        </div>

        <div>
          <label htmlFor="subject" className="field-label">Subject</label>
          <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="input" required />
        </div>

        <div>
          <label htmlFor="body" className="field-label">Message</label>
          <textarea id="body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} className="input resize-y" required />
          <p className="field-hint">
            Every message includes an unsubscribe link. Placeholders: {"{{first_name}}"}, {"{{event_title}}"}, {"{{date}}"}.
          </p>
        </div>
      </div>

      {!ready && (
        <div className="mt-3 flex items-start gap-2 rounded-xs border border-gold-500/35 bg-gold-500/[0.07] p-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" strokeWidth={2.4} />
          <p className="text-[0.6875rem] leading-relaxed text-ink-600">
            <strong className="font-semibold capitalize">{channel}</strong> is not configured in this
            environment, so sending is disabled. Add the provider credentials to enable it - the
            platform will never report a send that did not happen.
          </p>
        </div>
      )}

      <button type="submit" disabled={sending || !ready} className="btn-ink mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40">
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Queuing...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" strokeWidth={2.4} />
            Queue campaign
          </>
        )}
      </button>
    </form>
  );
}
