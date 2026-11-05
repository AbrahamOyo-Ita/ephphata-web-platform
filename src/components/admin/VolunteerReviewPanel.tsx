"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";

const STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "accepted", label: "Accepted" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "declined", label: "Declined" },
] as const;

export function VolunteerReviewPanel({
  volunteerId,
  initialStatus,
  initialDepartment,
  initialNotes,
  departments,
}: {
  volunteerId: string;
  initialStatus: string;
  initialDepartment: string;
  initialNotes: string;
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [departmentId, setDepartmentId] = useState(initialDepartment);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    status !== initialStatus || departmentId !== initialDepartment || notes !== initialNotes;

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/volunteers/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId, status, departmentId: departmentId || undefined, internalNotes: notes }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network problem - please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5 lg:sticky lg:top-20">
      <h2 className="text-[0.8125rem] font-semibold text-ink-900">Review application</h2>

      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xs border border-danger/25 bg-danger/[0.06] p-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.4} />
          <p className="text-[0.75rem] text-ink-800">{error}</p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input py-2.5 text-[0.8125rem]"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="department" className="field-label">Assigned department</label>
          <select
            id="department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="input py-2.5 text-[0.8125rem]"
          >
            <option value="">- Unassigned -</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="field-label">
            Internal notes <span className="font-normal text-ink-400">(not visible to applicant)</span>
          </label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Interview notes, availability confirmations..."
            className="input resize-y py-2.5 text-[0.8125rem]"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving || !dirty}
        className="btn-ink mt-4 w-full disabled:opacity-40"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <>
            <Check className="h-4 w-4" strokeWidth={3} />
            Saved
          </>
        ) : (
          "Save review"
        )}
      </button>

      {dirty && (
        <p className="mt-2 text-center text-[0.625rem] text-ink-400">Unsaved changes</p>
      )}

      <p className="mt-4 border-t border-ink-900/[0.07] pt-3 text-[0.625rem] leading-relaxed text-ink-400">
        Changing the status records your identity and the time against this application, and
        writes an entry to the audit log.
      </p>
    </div>
  );
}
