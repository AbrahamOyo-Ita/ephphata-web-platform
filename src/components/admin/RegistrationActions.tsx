"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Loader2, UserX, AlertCircle } from "lucide-react";

export function RegistrationActions({
  id,
  status,
  checkedIn,
  reference,
}: {
  id: string;
  status: string;
  checkedIn: boolean;
  reference: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/registrations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not cancel the registration.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network problem - please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
      <h2 className="text-[0.8125rem] font-semibold text-ink-900">Actions</h2>

      {error && (
        <div role="alert" className="mt-2.5 flex items-start gap-2 rounded-xs border border-danger/25 bg-danger/[0.06] p-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.4} />
          <p className="text-[0.75rem] text-ink-800">{error}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(reference);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard unavailable */
            }
          }}
          className="btn-outline btn-sm"
        >
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy reference"}
        </button>

        {status !== "cancelled" && !checkedIn && (
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="btn-outline btn-sm hover:border-danger/40 hover:bg-danger/[0.05] hover:text-danger disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
            Cancel registration
          </button>
        )}
      </div>

      <p className="mt-2.5 text-[0.625rem] leading-relaxed text-ink-400">
        {checkedIn
          ? "Attendance has been recorded, so this registration can no longer be cancelled - the record must stay auditable."
          : "Cancelling keeps the record for reporting but frees the place and blocks check-in. The action is audited."}
      </p>
    </div>
  );
}
