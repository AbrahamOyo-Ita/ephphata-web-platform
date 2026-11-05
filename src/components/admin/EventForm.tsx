"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle, Save } from "lucide-react";

type EventInput = {
  id?: string;
  title: string;
  slug: string;
  theme: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  capacity: number;
  status: string;
  registrationOpen: boolean;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft - hidden from the public site" },
  { value: "published", label: "Published - visible, registration open" },
  { value: "registration_closed", label: "Published - registration closed" },
  { value: "live", label: "Live - event in progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

/** Convert an ISO timestamp to the local value a datetime-local input expects. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  event,
  departments,
}: {
  event?: EventInput;
  departments?: { id: string; name: string; capacity: number | null }[];
}) {
  const router = useRouter();
  const isNew = !event?.id;
  const [values, setValues] = useState<EventInput>(
    event ?? {
      title: "",
      slug: "",
      theme: "",
      description: "",
      startsAt: "",
      endsAt: "",
      venueName: "",
      venueAddress: "",
      capacity: 0,
      status: "draft",
      registrationOpen: true,
    }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof EventInput>(k: K, v: EventInput[K]) => {
    setValues((p) => {
      const next = { ...p, [k]: v };
      // Auto-derive the slug from the title while creating
      if (k === "title" && isNew) {
        next.slug = String(v)
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 60);
      }
      return next;
    });
    if (fieldErrors[k as string]) {
      setFieldErrors(({ [k]: _d, ...r }) => r);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSaved(false);

    try {
      const res = await fetch(isNew ? "/api/admin/events" : `/api/admin/events/${event!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; id?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not save the event.");
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        return;
      }
      setSaved(true);
      router.refresh();
      if (isNew && json.id) router.push(`/admin/events/${json.id}`);
      else window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network problem - please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
        <h2 className="text-[0.8125rem] font-semibold text-ink-900">Details</h2>

        {error && (
          <div role="alert" className="mt-3 flex items-start gap-2 rounded-xs border border-danger/25 bg-danger/[0.06] p-2.5">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.4} />
            <p className="text-[0.75rem] text-ink-800">{error}</p>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="field-label">Event title</label>
            <input id="title" value={values.title} onChange={(e) => set("title", e.target.value)} className="input" required />
            {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="field-label">
              URL slug <span className="font-normal text-ink-400">(/events/...)</span>
            </label>
            <input
              id="slug"
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
              className="input font-mono text-[0.8125rem]"
              required
            />
            {fieldErrors.slug && <p className="field-error">{fieldErrors.slug}</p>}
          </div>

          <div>
            <label htmlFor="theme" className="field-label">Theme <span className="font-normal text-ink-400">(optional)</span></label>
            <input id="theme" value={values.theme} onChange={(e) => set("theme", e.target.value)} className="input" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="field-label">Description</label>
            <textarea
              id="description"
              rows={3}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="input resize-y"
            />
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
        <h2 className="text-[0.8125rem] font-semibold text-ink-900">When &amp; where</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="startsAt" className="field-label">Starts</label>
            <input
              id="startsAt"
              type="datetime-local"
              value={toLocalInput(values.startsAt)}
              onChange={(e) => set("startsAt", e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="input"
              required
            />
            {fieldErrors.startsAt && <p className="field-error">{fieldErrors.startsAt}</p>}
          </div>
          <div>
            <label htmlFor="endsAt" className="field-label">Ends <span className="font-normal text-ink-400">(optional)</span></label>
            <input
              id="endsAt"
              type="datetime-local"
              value={toLocalInput(values.endsAt)}
              onChange={(e) => set("endsAt", e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="input"
            />
            {fieldErrors.endsAt && <p className="field-error">{fieldErrors.endsAt}</p>}
          </div>
          <div>
            <label htmlFor="venueName" className="field-label">Venue</label>
            <input id="venueName" value={values.venueName} onChange={(e) => set("venueName", e.target.value)} className="input" required />
            {fieldErrors.venueName && <p className="field-error">{fieldErrors.venueName}</p>}
          </div>
          <div>
            <label htmlFor="venueAddress" className="field-label">Address <span className="font-normal text-ink-400">(optional)</span></label>
            <input id="venueAddress" value={values.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} className="input" />
          </div>
        </div>
        <p className="mt-3 text-[0.625rem] leading-relaxed text-ink-400">
          Times are entered and displayed in West Africa Time (Africa/Lagos) and stored as UTC.
        </p>
      </div>

      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
        <h2 className="text-[0.8125rem] font-semibold text-ink-900">Registration &amp; visibility</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="field-label">Status</label>
            <select id="status" value={values.status} onChange={(e) => set("status", e.target.value)} className="input">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="capacity" className="field-label">Capacity <span className="font-normal text-ink-400">(0 = unlimited)</span></label>
            <input
              id="capacity"
              type="number"
              min={0}
              value={values.capacity}
              onChange={(e) => set("capacity", Number(e.target.value))}
              className="input tabular-nums"
            />
          </div>
        </div>

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xs bg-paper-50 p-3">
          <input
            type="checkbox"
            checked={values.registrationOpen}
            onChange={(e) => set("registrationOpen", e.target.checked)}
            className="checkbox mt-0.5"
          />
          <span className="text-[0.75rem] leading-relaxed text-ink-700">
            <strong className="font-semibold">Registration open</strong>
            <br />
            Unchecking closes the public registration form while keeping the event page live.
          </span>
        </label>

        <p className="mt-3 rounded-xs bg-paper-50 px-3 py-2 text-[0.6875rem] leading-relaxed text-ink-500">
          Only <strong>Published</strong> and <strong>Live</strong> events appear on the public site.
          Registration additionally requires the toggle above and remaining capacity.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-ink">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved && !isNew ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" strokeWidth={2.4} />
              {isNew ? "Create event" : "Save changes"}
            </>
          )}
        </button>
        {saved && <span className="text-[0.75rem] text-emerald-700">Changes are live.</span>}
      </div>
    </form>
  );
}
