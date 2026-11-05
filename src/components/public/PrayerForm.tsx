"use client";

import { useState } from "react";
import { Loader2, AlertCircle, ArrowRight, Check, Lock } from "lucide-react";
import { prayerSchema, fieldErrors } from "@/lib/validation";

const CATEGORIES = [
  { value: "salvation", label: "Salvation" },
  { value: "healing", label: "Healing" },
  { value: "family", label: "Family" },
  { value: "provision", label: "Provision" },
  { value: "direction", label: "Direction" },
  { value: "thanksgiving", label: "Thanksgiving" },
  { value: "other", label: "Other" },
];

export function PrayerForm() {
  const [values, setValues] = useState({
    isAnonymous: false,
    displayName: "",
    email: "",
    phone: "",
    request: "",
    category: "other",
    allowFollowUp: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _d, ...r }) => r);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = prayerSchema.safeParse(values);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      setFormError("Please check the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as { ok?: boolean; reference?: string; error?: string };
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? "We could not submit your request. Please try again.");
        return;
      }
      setReference(json.reference!);
    } catch {
      setFormError("Network problem - please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div role="status" aria-live="polite" className="py-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xs bg-ink-900 text-white">
          <Check className="h-6 w-6" strokeWidth={2.6} />
        </div>
        <h3 className="mt-5 font-display text-2xl uppercase tracking-wide text-ink-900">
          We have it.
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-ink-600">
          Your request has been received by the prayer team. They will pray over it - you do not
          need to do anything else.
        </p>
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-xs bg-paper-100 px-3 py-1.5 font-mono text-[0.75rem] text-ink-600">
          <Lock className="h-3 w-3" strokeWidth={2.2} />
          {reference}
        </p>
        <p className="mt-4 text-[0.6875rem] leading-relaxed text-ink-400">
          Keep this reference if you would like to follow up with the team.
        </p>
        <button
          type="button"
          onClick={() => {
            setReference(null);
            setValues({
              isAnonymous: false, displayName: "", email: "", phone: "",
              request: "", category: "other", allowFollowUp: false,
            });
          }}
          className="btn-outline btn-sm mt-7"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <h2 className="font-display text-lg uppercase tracking-wide text-ink-900">
          Your request
        </h2>
        <p className="mt-1 text-[0.8125rem] text-ink-500">
          Only the prayer team will read this.
        </p>
      </div>

      {formError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-sm border border-danger/25 bg-danger/[0.06] p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2.2} />
          <p className="text-[0.8125rem] font-medium text-ink-800">{formError}</p>
        </div>
      )}

      <div>
        <label htmlFor="request" className="field-label">
          What would you like us to pray about?{" "}
          <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <textarea
          id="request"
          name="request"
          rows={6}
          value={values.request}
          onChange={(e) => set("request", e.target.value)}
          aria-invalid={Boolean(errors.request)}
          placeholder="Write freely. There is no right way to say it."
          className="input resize-y"
        />
        <div className="mt-1 flex items-start justify-between gap-4">
          {errors.request ? (
            <p className="field-error" role="alert">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
              {errors.request}
            </p>
          ) : (
            <span className="text-[0.6875rem] text-ink-400">Minimum 15 characters.</span>
          )}
          <span className="shrink-0 text-[0.6875rem] tabular-nums text-ink-400">
            {values.request.length}/3000
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="category" className="field-label">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={values.category}
          onChange={(e) => set("category", e.target.value)}
          className="input"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-sm border border-ink-900/10 bg-paper-50 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={values.isAnonymous}
            onChange={(e) => set("isAnonymous", e.target.checked)}
            className="checkbox"
          />
          <span>
            <span className="block text-[0.8125rem] font-semibold text-ink-900">
              Submit anonymously
            </span>
            <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-ink-500">
              We won&apos;t ask for your name or contact details.
            </span>
          </span>
        </label>
      </div>

      {!values.isAnonymous && (
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="field-label">
              Your name <span className="ml-1.5 font-normal text-ink-400">(optional)</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              value={values.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              autoComplete="name"
              className="input"
              placeholder="First name is enough"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-ink-900/10 bg-white p-4">
            <input
              type="checkbox"
              checked={values.allowFollowUp}
              onChange={(e) => set("allowFollowUp", e.target.checked)}
              className="checkbox"
            />
            <span>
              <span className="block text-[0.8125rem] font-semibold text-ink-900">
                I would like someone to follow up with me
              </span>
              <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-ink-500">
                Required before we can collect contact details.
              </span>
            </span>
          </label>

          {values.allowFollowUp && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="field-label">Email</label>
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
              <div>
                <label htmlFor="phone" className="field-label">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  className="input"
                />
                {errors.phone && <p className="field-error" role="alert">{errors.phone}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-ink btn-lg group w-full">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
            Submit privately
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      <p className="text-center text-[0.6875rem] leading-relaxed text-ink-400">
        This form is not for emergencies. If you are in danger, please contact local emergency services.
      </p>
    </form>
  );
}
