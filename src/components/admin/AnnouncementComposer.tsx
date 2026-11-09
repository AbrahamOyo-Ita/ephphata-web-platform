"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Loader2, Check, AlertCircle } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

/**
 * Publishes a site announcement from the Content page.
 * Announcements are the copy an operator can change without a deploy; the
 * public site reads published rows only, so the publish toggle matters.
 */
export function AnnouncementComposer({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState("info");
  const [publish, setPublish] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!canManage) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, severity, publish }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not publish the announcement.");
        return;
      }
      setDone(true);
      setTitle("");
      setBody("");
      setSeverity("info");
      setPublish(true);
      router.refresh();
      window.setTimeout(() => setDone(false), 3000);
    } catch {
      setError("Network problem - please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ink btn-sm">
        <Megaphone className="h-3.5 w-3.5" strokeWidth={2.4} />
        New announcement
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="w-full rounded-sm border border-ink-900/[0.08] bg-white p-4">
      <h2 className="text-[0.8125rem] font-semibold text-ink-900">New announcement</h2>
      <p className="mt-0.5 text-[0.625rem] text-ink-400">
        Published announcements are visible on the public site. Drafts stay internal.
      </p>

      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xs border border-danger/25 bg-danger/[0.06] p-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.4} />
          <p className="text-[0.75rem] text-ink-800">{error}</p>
        </div>
      )}
      {done && (
        <div className="mt-3 flex items-center gap-2 rounded-xs border border-emerald-300/60 bg-emerald-50 p-2.5">
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" strokeWidth={3} />
          <p className="text-[0.75rem] font-medium text-ink-900">Announcement saved.</p>
        </div>
      )}

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="ann-title" className="field-label">
            Title
          </label>
          <input
            id="ann-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
            maxLength={120}
            placeholder="Gate opens at 2pm"
          />
        </div>

        <div>
          <label htmlFor="ann-body" className="field-label">
            Message
          </label>
          <textarea
            id="ann-body"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input resize-y"
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ann-severity" className="field-label">
              Severity
            </label>
            <CustomSelect
              id="ann-severity"
              value={severity}
              onChange={setSeverity}
              options={[{ value: "info", label: "Info" }, { value: "important", label: "Important" }, { value: "urgent", label: "Urgent" }]}
            />
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-2 rounded-xs bg-paper-50 p-2.5">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="checkbox mt-0.5"
            />
            <span className="text-[0.6875rem] leading-relaxed text-ink-700">
              <strong className="font-semibold">Publish now</strong>
              <br />
              Uncheck to save as a draft.
            </span>
          </label>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={saving} className="btn-ink btn-sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save announcement"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">
          Close
        </button>
      </div>
    </form>
  );
}
