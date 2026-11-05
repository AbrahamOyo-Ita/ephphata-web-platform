import { ShieldCheck, UserPlus, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { activeSuperAdmins, listTeam } from "@/lib/data/team";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLES, permissionsFor } from "@/lib/permissions";
import { formatRelative, initials } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TeamTable } from "@/components/admin/TeamTable";
import { InviteMemberForm } from "@/components/admin/InviteMemberForm";
import { DemoBanner } from "@/components/admin/DemoBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requireUser("team.manage");
  const team = listTeam();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-400">Team</p>
          <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
            Staff &amp; roles
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            {team.length} accounts · {team.filter((m) => m.status === "active").length} active
          </p>
        </div>
        <DemoBanner compact />
      </div>

      <div className="flex items-start gap-2.5 rounded-xs border border-ink-900/15 bg-paper-50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={2.2} />
        <div className="text-[0.75rem] leading-relaxed text-ink-700">
          <p className="font-semibold">Accounts are invitation-only</p>
          <p className="mt-0.5 text-ink-500">
            There is no public sign-up. Every account is created here by a super admin, and
            permissions are enforced on the server and at the database level - hiding a button is
            never the only control.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-3">
          <TeamTable
            members={team.map((m) => ({
              ...m,
              lastLoginLabel: m.last_login_at ? formatRelative(m.last_login_at) : "Never",
              initials: initials(m.full_name),
              roleLabel: ROLE_LABELS[m.role] ?? m.role,
            }))}
            currentUserId={user.id}
            currentRole={user.role}
            superAdminCount={activeSuperAdmins()}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <InviteMemberForm roles={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />

          <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
            <h2 className="text-[0.8125rem] font-semibold text-ink-900">What each role can do</h2>
            <ul className="mt-2.5 space-y-2">
              {ROLES.map((r) => (
                <li key={r} className="border-b border-ink-900/[0.05] pb-2 last:border-0 last:pb-0">
                  <p className="text-[0.75rem] font-semibold text-ink-800">{ROLE_LABELS[r]}</p>
                  <p className="text-[0.625rem] leading-relaxed text-ink-400">
                    {ROLE_DESCRIPTIONS[r]}
                  </p>
                  <p className="mt-0.5 text-[0.5625rem] text-ink-400">
                    {permissionsFor(r).length} permissions
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2.5 rounded-sm border border-ink-900/[0.08] bg-white p-4">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2.2} />
            <p className="text-[0.625rem] leading-relaxed text-ink-500">
              Invited accounts cannot sign in until they set a password from their invite link.
              Suspending an account immediately destroys its active sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
