"use client";

import { useState } from "react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  PartyPopper,
  MailX,
} from "lucide-react";
import { volunteerSchema, fieldErrors, AVAILABILITY_SLOTS } from "@/lib/validation";

type Errors = Record<string, string>;

export function VolunteerForm({
  eventSlug,
  departments,
}: {
  eventSlug: string;
  departments: { id: string; name: string }[];
}) {
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsapp: "",
    departmentId: "",
    secondChoiceId: "",
    experience: "",
    availability: [] as string[],
    motivation: "",
    consent: false,
    honeypot: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string; emailStatus: string } | null>(null);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _d, ...r }) => r);
  };

  function toggleSlot(id: string) {
    setValues((p) => ({
      ...p,
      availability: p.availability.includes(id)
        ? p.availability.filter((s) => s !== id)
        : [...p.availability, id],
    }));
    if (errors.availability) setErrors(({ availability: _d, ...r }) => r);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = volunteerSchema.safeParse({ ...values, eventSlug });
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      setFormError("Please check the highlighted fields and try again.");
      const first = Object.keys(errs)[0];
      if (first) {
        document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        error?: string;
        emailStatus?: string;
        fieldErrors?: Errors;
      };

      if (!res.ok || !json.ok) {
        if (json.fieldErrors) setErrors(json.fieldErrors);
        setFormError(json.error ?? "We could not submit your application. Please try again.");
        return;
      }
      setDone({ reference: json.reference!, emailStatus: json.emailStatus ?? "not_configured" });
    } catch {
      setFormError("Network problem - please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success state ── */
  if (done) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-emerald-300/60 bg-emerald-50 p-7 text-center"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xs bg-emerald-500 text-white">
          <PartyPopper className="h-5 w-5" strokeWidth={2} />
        </div>
        <h3 className="mt-5 font-display text-xl uppercase tracking-wide text-ink-900">
          Application received
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[0.875rem] leading-relaxed text-ink-700">
          Thank you for offering to serve. Your reference is{" "}
          <span className="font-mono font-bold text-ink-900">{done.reference}</span>. The
          coordination team will review your application and contact you.
        </p>

        {done.emailStatus === "not_configured" && (
          <p className="mx-auto mt-4 flex max-w-sm items-start gap-2 rounded-sm bg-white/70 p-3 text-left text-[0.6875rem] leading-relaxed text-ink-600">
            <MailX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" strokeWidth={2.2} />
            Confirmation email is not configured on this deployment yet. Please note your
            reference above - your application is saved either way.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setDone(null);
            setValues({
              fullName: "", email: "", phone: "", whatsapp: "", departmentId: "",
              secondChoiceId: "", experience: "", availability: [], motivation: "",
              consent: false, honeypot: "",
            });
          }}
          className="btn-outline btn-sm mt-6"
        >
          Submit another application
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
        <Input
          label="Full name"
          name="fullName"
          value={values.fullName}
          onChange={(v) => set("fullName", v)}
          error={errors.fullName}
          autoComplete="name"
          required
        />
        <Input
          label="Email address"
          name="email"
          type="email"
          value={values.email}
          onChange={(v) => set("email", v)}
          error={errors.email}
          autoComplete="email"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Phone number"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={(v) => set("phone", v)}
          error={errors.phone}
          placeholder="0803 123 4567"
          autoComplete="tel"
          required
        />
        <Input
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          value={values.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          error={errors.whatsapp}
          optional
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="departmentId" className="field-label">
            First choice department <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <CustomSelect
            id="departmentId"
            name="departmentId"
            value={values.departmentId}
            onChange={(value) => set("departmentId", value)}
            aria-label="First choice department"
            invalid={Boolean(errors.departmentId)}
            options={[{ value: "", label: "Select a department" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
          />
          {errors.departmentId && (
            <p className="field-error" role="alert">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
              {errors.departmentId}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="secondChoiceId" className="field-label">
            Second choice <span className="ml-1.5 font-normal text-ink-400">(optional)</span>
          </label>
          <CustomSelect
            id="secondChoiceId"
            name="secondChoiceId"
            value={values.secondChoiceId}
            onChange={(value) => set("secondChoiceId", value)}
            options={[{ value: "", label: "No preference" }, ...departments.filter((d) => d.id !== values.departmentId).map((d) => ({ value: d.id, label: d.name }))]}
          />
        </div>
      </div>

      <fieldset>
        <legend className="field-label">
          When are you available? <span className="text-danger" aria-hidden="true">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AVAILABILITY_SLOTS.map((slot) => {
            const active = values.availability.includes(slot.id);
            return (
              <label
                key={slot.id}
                className={`flex cursor-pointer items-center gap-2.5 rounded-sm border px-3.5 py-3 transition-colors ${
                  active
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-900/15 bg-white hover:border-ink-900/30"
                }`}
              >
                <input
                  type="checkbox"
                  name="availability"
                  value={slot.id}
                  checked={active}
                  onChange={() => toggleSlot(slot.id)}
                  className="sr-only"
                />
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border ${
                    active ? "border-white bg-white text-ink-900" : "border-ink-900/25"
                  }`}
                >
                  {active && <CheckCircle2 className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="text-[0.8125rem] font-medium">{slot.label}</span>
              </label>
            );
          })}
        </div>
        {errors.availability && (
          <p className="field-error" role="alert">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
            {errors.availability}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="experience" className="field-label">
          Relevant experience <span className="ml-1.5 font-normal text-ink-400">(optional)</span>
        </label>
        <textarea
          id="experience"
          name="experience"
          rows={3}
          value={values.experience}
          onChange={(e) => set("experience", e.target.value)}
          placeholder="Any previous serving experience, skills or certifications."
          className="input resize-y"
        />
        {errors.experience && <p className="field-error">{errors.experience}</p>}
      </div>

      <div>
        <label htmlFor="motivation" className="field-label">
          Why do you want to serve? <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={4}
          value={values.motivation}
          onChange={(e) => set("motivation", e.target.value)}
          aria-invalid={Boolean(errors.motivation)}
          placeholder="A short paragraph is enough."
          className="input resize-y"
        />
        <div className="mt-1 flex items-start justify-between gap-4">
          {errors.motivation ? (
            <p className="field-error" role="alert">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
              {errors.motivation}
            </p>
          ) : (
            <span className="text-[0.6875rem] text-ink-400">Minimum 20 characters.</span>
          )}
          <span className="shrink-0 text-[0.6875rem] tabular-nums text-ink-400">
            {values.motivation.length}/900
          </span>
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            checked={values.consent}
            onChange={(e) => set("consent", e.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            className="checkbox"
          />
          <span className="text-[0.8125rem] leading-relaxed text-ink-700">
            I confirm I am available on the event day, agree to follow the direction of my
            department coordinator, and accept the{" "}
            <a href="/privacy" className="font-semibold underline underline-offset-2">privacy notice</a>.
          </span>
        </label>
        {errors.consent && (
          <p className="field-error ml-[30px]" role="alert">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
            {errors.consent}
          </p>
        )}
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
            Submitting...
          </>
        ) : (
          <>
            Submit application
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
  required,
  optional,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-400">(optional)</span>}
        {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
      {error && (
        <p id={`${name}-error`} className="field-error" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
          {error}
        </p>
      )}
    </div>
  );
}
