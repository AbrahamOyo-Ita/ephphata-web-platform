"use client";

import { useState } from "react";
import { Loader2, AlertCircle, ArrowRight, Check } from "lucide-react";
import { contactSchema, fieldErrors } from "@/lib/validation";

const SUBJECTS = [
  { value: "general", label: "General enquiry" },
  { value: "event", label: "About an event" },
  { value: "volunteer", label: "Volunteering" },
  { value: "partnership", label: "Partnership" },
  { value: "media", label: "Media & press" },
];

export function ContactForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
    honeypot: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _d, ...r }) => r);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setFormError("Please check the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? "We could not send your message. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setFormError("Network problem - please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" aria-live="polite" className="rounded-md border border-emerald-300/60 bg-emerald-50 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xs bg-emerald-500 text-white">
          <Check className="h-5 w-5" strokeWidth={2.8} />
        </div>
        <h3 className="mt-5 font-display text-xl uppercase tracking-wide text-ink-900">
          Message sent
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[0.875rem] leading-relaxed text-ink-700">
          Thank you - your message has been logged and the team will respond. Enquiries are
          usually answered within two working days.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setValues({ name: "", email: "", subject: "general", message: "", honeypot: "" });
          }}
          className="btn-outline btn-sm mt-6"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-sm border border-danger/25 bg-danger/[0.06] p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2.2} />
          <p className="text-[0.8125rem] font-medium text-ink-800">{formError}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">
            Your name <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            name="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className="input"
          />
          {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="input"
          />
          {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="field-label">What is this about?</label>
        <select
          id="subject"
          name="subject"
          value={values.subject}
          onChange={(e) => set("subject", e.target.value)}
          className="input"
        >
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="field-label">
          Message <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
          className="input resize-y"
          placeholder="Tell us what you need."
        />
        {errors.message && <p className="field-error" role="alert">{errors.message}</p>}
      </div>

      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <input
          tabIndex={-1}
          autoComplete="off"
          value={values.honeypot}
          onChange={(e) => set("honeypot", e.target.value)}
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-ink btn-lg group w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send message
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
