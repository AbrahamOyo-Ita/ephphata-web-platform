"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Check, ArrowRight, Copy } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

type Errors = Record<string, string>;

export function ManualRegistrationForm({
  events,
  defaultEventId,
  actorName,
}: {
  events: { id: string; title: string; slug: string }[];
  defaultEventId: string;
  actorName: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    eventId: defaultEventId,
    firstName: "",
    lastName: "",
    occupation: "",
    email: "",
    phone: "",
    whatsapp: "",
    city: "",
    attendanceIntent: "in_person",
    heardVia: "other",
    commEmail: true,
    commWhatsapp: false,
    consentPrivacy: true,
    status: "confirmed",
    notes: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ id: string; reference: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _d, ...r }) => r);
    if (formError) setFormError(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    setDuplicate(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, eventSlug: "ignored" }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        id?: string;
        reference?: string;
        error?: string;
        code?: string;
        existingReference?: string;
        fieldErrors?: Errors;
      };

      if (!res.ok || !json.ok) {
        if (json.fieldErrors) setErrors(json.fieldErrors);
        if (json.code === "duplicate" && json.existingReference) setDuplicate(json.existingReference);
        setFormError(json.error ?? "Could not create the registration.");
        return;
      }

      setCreated({ id: json.id!, reference: json.reference! });
      router.refresh();
    } catch {
      setFormError("Network problem - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xs bg-emerald-500 text-white">
          <Check className="h-5 w-5" strokeWidth={3} />
        </div>
        <h2 className="mt-4 text-[0.9375rem] font-semibold text-ink-900">
          Registration created
        </h2>
        <p className="mt-1.5 text-[0.8125rem] text-ink-500">
          Recorded by {actorName} · source: staff
        </p>

        <div className="mx-auto mt-5 max-w-xs rounded-sm border border-ink-900/10 bg-paper-50 p-4">
          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-ink-400">
            Reference
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-tight text-ink-900">
            {created.reference}
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(created.reference);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              } catch {
                /* clipboard unavailable */
              }
            }}
            className="mt-2 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-ink-900 underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy reference"}
          </button>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href={`/admin/registrations/${created.id}`} className="btn-ink btn-sm">
            View registration
          </Link>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setValues((v) => ({
                ...v,
                firstName: "", lastName: "", occupation: "", email: "", phone: "", whatsapp: "", city: "", notes: "",
              }));
            }}
            className="btn-outline btn-sm"
          >
            Register another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <div role="alert" className="rounded-xs border border-danger/25 bg-danger/[0.06] p-3">
          <p className="flex items-start gap-2 text-[0.8125rem] font-medium text-ink-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.4} />
            {formError}
          </p>
          {duplicate && (
            <p className="mt-1.5 pl-5 text-[0.75rem] text-ink-600">
              Existing reference: <span className="font-mono font-semibold">{duplicate}</span>
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="eventId" className="field-label">Event</label>
        <CustomSelect
          id="eventId"
          value={values.eventId}
          onChange={(value) => set("eventId", value)}
          options={events.map((event) => ({ value: event.id, label: event.title }))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField label="First name" name="firstName" value={values.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} required />
        <AdminField label="Last name" name="lastName" value={values.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} required />
      </div>

      <AdminField label="Occupation" name="occupation" value={values.occupation} onChange={(v) => set("occupation", v)} error={errors.occupation} required />

      <AdminField label="Email address" name="email" type="email" value={values.email} onChange={(v) => set("email", v)} error={errors.email} required />

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField label="Phone" name="phone" type="tel" value={values.phone} onChange={(v) => set("phone", v)} error={errors.phone} required />
        <AdminField label="WhatsApp" name="whatsapp" type="tel" value={values.whatsapp} onChange={(v) => set("whatsapp", v)} error={errors.whatsapp} optional />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField label="City" name="city" value={values.city} onChange={(v) => set("city", v)} error={errors.city} optional />
        <div>
          <label htmlFor="status" className="field-label">Registration status</label>
          <CustomSelect
            id="status"
            value={values.status}
            onChange={(value) => set("status", value)}
            options={[{ value: "confirmed", label: "Confirmed" }, { value: "waitlisted", label: "Waitlisted" }]}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="field-label">
          Internal note <span className="ml-1.5 font-normal text-ink-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={2}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. Registered at the gate - paid on arrival"
          className="input resize-y"
        />
      </div>

      <div className="space-y-2.5 rounded-xs bg-paper-50 p-3.5">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input type="checkbox" checked={values.commEmail} onChange={(e) => set("commEmail", e.target.checked)} className="checkbox" />
          <span className="text-[0.75rem] leading-relaxed text-ink-700">Attendee agreed to email updates</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5">
          <input type="checkbox" checked={values.consentPrivacy} onChange={(e) => set("consentPrivacy", e.target.checked)} className="checkbox" />
          <span className="text-[0.75rem] leading-relaxed text-ink-700">
            Attendee was shown the privacy notice and agreed{" "}
            {errors.consentPrivacy && <span className="font-semibold text-danger">- required</span>}
          </span>
        </label>
      </div>

      <button type="submit" disabled={submitting} className="btn-ink w-full group">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            Create registration
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}

function AdminField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  required,
  optional,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
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
        required={required}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
      {error && (
        <p className="field-error" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
          {error}
        </p>
      )}
    </div>
  );
}
