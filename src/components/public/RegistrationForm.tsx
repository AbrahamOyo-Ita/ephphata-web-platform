"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight, Info } from "lucide-react";
import { registrationSchema, fieldErrors, formatPhone } from "@/lib/validation";
import { HEARD_VIA_LABELS } from "@/lib/site";
import { CustomSelect } from "@/components/ui/CustomSelect";

const HEARD_OPTIONS = Object.entries(HEARD_VIA_LABELS);

type Errors = Record<string, string>;

/**
 * Public registration form.
 * - Validates with the same Zod schema the server uses.
 * - Shows inline, specific, accessible errors (aria-describedby + role=alert).
 * - Never announces a confirmation email that was not actually dispatched.
 */
export function RegistrationForm({
  eventSlug,
  eventTitle,
}: {
  eventSlug: string;
  eventTitle: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateRef, setDuplicateRef] = useState<string | null>(null);

  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    occupation: "",
    email: "",
    phone: "",
    whatsapp: "",
    city: "",
    attendanceIntent: "in_person",
    heardVia: "social_media",
    commEmail: true,
    commWhatsapp: false,
    commNewsletter: false,
    consentPrivacy: false,
    honeypot: "",
  });

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors(({ [key]: _drop, ...rest }) => rest);
    if (formError) setFormError(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    setDuplicateRef(null);

    const parsed = registrationSchema.safeParse({ ...values, eventSlug });
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      setFormError("Please check the highlighted fields and try again.");
      // Move focus to the first invalid control for screen-reader users.
      const firstKey = Object.keys(errs)[0];
      if (firstKey) {
        const el = document.querySelector<HTMLElement>(`[name="${firstKey}"]`);
        el?.focus();
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        error?: string;
        code?: string;
        existingReference?: string;
        fieldErrors?: Errors;
      };

      if (res.status === 429) {
        setFormError(json.error ?? "Too many attempts. Please wait a moment and try again.");
        return;
      }
      if (!res.ok || !json.ok) {
        if (json.fieldErrors) setErrors(json.fieldErrors);
        if (json.code === "duplicate" && json.existingReference) {
          setDuplicateRef(json.existingReference);
        }
        setFormError(json.error ?? "We could not complete your registration. Please try again.");
        return;
      }

      router.push(`/register/success?ref=${encodeURIComponent(json.reference!)}`);
    } catch {
      setFormError("Network problem - please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-sm border border-danger/25 bg-danger/[0.06] p-4"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2.2} />
          <div className="text-[0.8125rem] leading-relaxed text-ink-800">
            <p className="font-semibold">{formError}</p>
            {duplicateRef && (
              <p className="mt-1.5">
                Your reference is{" "}
                <span className="font-mono font-semibold text-ink-900">{duplicateRef}</span>.{" "}
                <a
                  href={`/register/success?ref=${duplicateRef}`}
                  className="font-semibold underline underline-offset-2"
                >
                  View your confirmation
                </a>
                .
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Name ── */}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Your name</legend>
        <Field
          label="First name"
          name="firstName"
          value={values.firstName}
          onChange={(v) => set("firstName", v)}
          error={errors.firstName}
          autoComplete="given-name"
          required
        />
        <Field
          label="Last name"
          name="lastName"
          value={values.lastName}
          onChange={(v) => set("lastName", v)}
          error={errors.lastName}
          autoComplete="family-name"
          required
        />
      </fieldset>

      <Field
        label="Occupation"
        name="occupation"
        value={values.occupation}
        onChange={(v) => set("occupation", v)}
        error={errors.occupation}
        placeholder="Student, teacher, entrepreneur..."
        autoComplete="organization-title"
        required
      />

      {/* ── Contact ── */}
      <Field
        label="Email address"
        name="email"
        type="email"
        inputMode="email"
        value={values.email}
        onChange={(v) => set("email", v)}
        error={errors.email}
        hint="Your confirmation and QR code are linked to this address."
        autoComplete="email"
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(v) => set("phone", v)}
          onBlur={() => values.phone && set("phone", formatPhone(values.phone))}
          error={errors.phone}
          placeholder="0803 123 4567"
          autoComplete="tel"
          required
        />
        <Field
          label="WhatsApp number"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          value={values.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          error={errors.whatsapp}
          hint="Only if different from your phone number."
          autoComplete="tel"
          optional
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="City or town"
          name="city"
          value={values.city}
          onChange={(v) => set("city", v)}
          error={errors.city}
          placeholder="Calabar"
          autoComplete="address-level2"
          optional
        />
        <div>
          <label htmlFor="heardVia" className="field-label">
            How did you hear about Ephphata?
          </label>
          <CustomSelect
            id="heardVia"
            name="heardVia"
            value={values.heardVia}
            onChange={(value) => set("heardVia", value)}
            options={HEARD_OPTIONS.map(([value, label]) => ({ value, label }))}
          />
          {errors.heardVia && <p className="field-error">{errors.heardVia}</p>}
        </div>
      </div>

      {/* ── Attendance intent ── */}
      <fieldset>
        <legend className="field-label">Will you attend in person?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { value: "in_person", label: "In person", note: "I'll be in the hall" },
            { value: "online", label: "Online", note: "If streamed" },
            { value: "undecided", label: "Not sure yet", note: "Still deciding" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col rounded-sm border p-3.5 transition-colors duration-200 ${
                values.attendanceIntent === opt.value
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-900/15 bg-white hover:border-ink-900/30"
              }`}
            >
              <input
                type="radio"
                name="attendanceIntent"
                value={opt.value}
                checked={values.attendanceIntent === opt.value}
                onChange={() => set("attendanceIntent", opt.value)}
                className="sr-only"
              />
              <span className="text-[0.8125rem] font-semibold">{opt.label}</span>
              <span
                className={`mt-0.5 text-[0.6875rem] ${
                  values.attendanceIntent === opt.value ? "text-white/60" : "text-ink-400"
                }`}
              >
                {opt.note}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Communication + consent ── */}
      <div className="space-y-4 rounded-sm border border-ink-900/10 bg-paper-50 p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-500">
          How should we reach you?
        </p>

        <CheckField
          checked={values.commEmail}
          onChange={(v) => set("commEmail", v)}
          label="Email me my confirmation and event-day details"
        />
        <CheckField
          checked={values.commWhatsapp}
          onChange={(v) => set("commWhatsapp", v)}
          label="Send me WhatsApp updates for this event"
        />
        <CheckField
          checked={values.commNewsletter}
          onChange={(v) => set("commNewsletter", v)}
          label="Add me to the newsletter for future gatherings"
          hint="Optional and separate from your registration."
        />

        <div className="border-t border-ink-900/10 pt-4">
          <CheckField
            checked={values.consentPrivacy}
            onChange={(v) => set("consentPrivacy", v)}
            label={
              <>
                I agree to the{" "}
                <a href="/privacy" className="font-semibold underline underline-offset-2">
                  privacy notice
                </a>{" "}
                and understand my details are used to manage this event.
              </>
            }
            error={errors.consentPrivacy}
            required
          />
        </div>
      </div>

      {/* Honeypot - visually hidden, never announced */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="honeypot">Leave this field empty</label>
        <input
          id="honeypot"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={values.honeypot}
          onChange={(e) => set("honeypot", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <button type="submit" disabled={submitting} className="btn-ink btn-lg group w-full sm:w-auto">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reserving your place...
            </>
          ) : (
            <>
              Complete registration
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>
        <p className="flex items-center gap-1.5 text-[0.6875rem] text-ink-400">
          <Info className="h-3 w-3 shrink-0" />
          Free · Takes under a minute
        </p>
      </div>

      <p className="text-[0.6875rem] leading-relaxed text-ink-400">
        Registering for {eventTitle} does not subscribe you to marketing messages. You choose
        that separately above.
      </p>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────── controls */

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  required,
  optional,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
}) {
  const describedBy = [error ? `${name}-error` : null, hint ? `${name}-hint` : null]
    .filter(Boolean)
    .join(" ");

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
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="input"
      />
      {error ? (
        <p id={`${name}-error`} className="field-error" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function CheckField({
  checked,
  onChange,
  label,
  hint,
  error,
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          required={required}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.checked)}
          className="checkbox"
        />
        <span className="text-[0.8125rem] leading-relaxed text-ink-700">{label}</span>
      </label>
      {hint && !error && <p className="ml-[30px] mt-1 text-[0.6875rem] text-ink-400">{hint}</p>}
      {error && (
        <p className="field-error ml-[30px]" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
          {error}
        </p>
      )}
    </div>
  );
}
