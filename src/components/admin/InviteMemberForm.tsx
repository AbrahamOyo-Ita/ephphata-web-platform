"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, AlertCircle, Check } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

export function InviteMemberForm({ roles }: { roles: { value: string; label: string }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("viewer");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setInviteLink(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, role }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; invitePath?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not create the invitation.");
        return;
      }
      setInviteLink(json.invitePath ?? null);
      setEmail("");
      setFullName("");
      router.refresh();
    } catch {
      setError("Network problem - please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
      <h2 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
        <UserPlus className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
        Invite a team member
      </h2>

      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xs border border-danger/25 bg-danger/[0.06] p-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.4} />
          <p className="text-[0.6875rem] text-ink-800">{error}</p>
        </div>
      )}

      {inviteLink && (
        <div className="mt-3 rounded-xs border border-emerald-300/60 bg-emerald-50 p-2.5">
          <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-emerald-800">
            <Check className="h-3 w-3" strokeWidth={3} />
            Invitation created
          </p>
          <p className="mt-1 text-[0.625rem] leading-relaxed text-ink-600">
            Share this one-time link with them directly. It is shown once and cannot be recovered -
            if it is lost, revoke the account and invite again.
          </p>
          <code className="mt-1.5 block break-all rounded bg-white px-2 py-1 font-mono text-[0.5625rem] text-ink-700">
            {inviteLink}
          </code>
        </div>
      )}

      <div className="mt-3 space-y-2.5">
        <div>
          <label htmlFor="inv-name" className="field-label">Full name</label>
          <input id="inv-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" required />
        </div>
        <div>
          <label htmlFor="inv-email" className="field-label">Work email</label>
          <input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
        </div>
        <div>
          <label htmlFor="inv-role" className="field-label">Role</label>
          <CustomSelect id="inv-role" value={role} onChange={setRole} options={roles} />
        </div>
      </div>

      <button type="submit" disabled={sending} className="btn-ink mt-3 w-full disabled:opacity-40">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create invitation"}
      </button>
    </form>
  );
}
