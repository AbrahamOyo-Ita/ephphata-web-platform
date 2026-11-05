"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, Mail, Lock, Check } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

type Member = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  phone: string | null;
  active_sessions: number;
  has_password: number;
  lastLoginLabel: string;
  initials: string;
  roleLabel: string;
};

export function TeamTable({
  members,
  currentUserId,
  currentRole,
  superAdminCount,
}: {
  members: Member[];
  currentUserId: string;
  currentRole: string;
  superAdminCount: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(id: string, patch: { role?: string; status?: string }) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not update the account.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network problem - please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-xs border border-danger/25 bg-danger/[0.06] p-3">
          <p className="flex items-start gap-2 text-[0.75rem] text-ink-800">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.4} />
            {error}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
        <ul className="divide-y divide-ink-900/[0.05]">
          {members.map((m) => {
            const isSelf = m.id === currentUserId;
            const isLastSuperAdmin = m.role === "super_admin" && superAdminCount <= 1;
            const locked = isSelf || isLastSuperAdmin || currentRole !== "super_admin";

            return (
              <li key={m.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xs bg-paper-100 text-[0.625rem] font-bold text-ink-600">
                    {m.initials}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[0.8125rem] font-semibold text-ink-900">{m.full_name}</p>
                      {isSelf && (
                        <span className="rounded bg-ink-900 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-wide text-white">
                          You
                        </span>
                      )}
                      <StatusBadge
                        tone={m.status === "active" ? "emerald" : m.status === "invited" ? "amber" : "flame"}
                        label={m.status === "active" ? "Active" : m.status === "invited" ? "Invited" : "Suspended"}
                      />
                    </div>
                    <p className="truncate text-[0.6875rem] text-ink-400">{m.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.625rem] text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5" />
                        {m.has_password ? "Password set" : "Invite pending"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        {m.active_sessions} session{m.active_sessions === 1 ? "" : "s"}
                      </span>
                      <span>Last login {m.lastLoginLabel}</span>
                    </div>
                  </div>

                  <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    {busyId === m.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />}

                    <select
                      value={m.role}
                      onChange={(e) => update(m.id, { role: e.target.value })}
                      disabled={locked || busyId === m.id}
                      aria-label={`Role for ${m.full_name}`}
                      className="h-8 rounded-md border border-ink-900/10 bg-paper-50 px-2 text-[0.6875rem] font-medium text-ink-700 disabled:opacity-40"
                    >
                      {[
                        "super_admin",
                        "event_admin",
                        "registration_officer",
                        "volunteer_coordinator",
                        "communications_manager",
                        "content_editor",
                        "prayer_team",
                        "programme_manager",
                        "check_in_officer",
                        "viewer",
                      ].map((r) => (
                        <option key={r} value={r}>
                          {r.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>

                    {m.status === "suspended" ? (
                      <button
                        type="button"
                        onClick={() => update(m.id, { status: "active" })}
                        disabled={locked || busyId === m.id}
                        className="rounded-md border border-ink-900/10 px-2 py-1 text-[0.625rem] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                      >
                        <Check className="mr-0.5 inline h-2.5 w-2.5" strokeWidth={3} />
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => update(m.id, { status: "suspended" })}
                        disabled={locked || busyId === m.id}
                        className="rounded-md border border-ink-900/10 px-2 py-1 text-[0.625rem] font-semibold text-ink-600 hover:border-danger/30 hover:bg-danger/[0.06] hover:text-danger disabled:opacity-40"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>

                {isLastSuperAdmin && (
                  <p className="mt-1.5 pl-12 text-[0.5625rem] text-ink-400">
                    Locked - the last active super admin cannot be changed.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
