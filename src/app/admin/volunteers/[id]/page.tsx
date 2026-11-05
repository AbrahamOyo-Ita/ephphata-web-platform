import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getVolunteer } from "@/lib/data/volunteers";
import { getDepartments } from "@/lib/data/events";
import { formatStamp, initials } from "@/lib/format";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { VolunteerReviewPanel } from "@/components/admin/VolunteerReviewPanel";
import { AVAILABILITY_SLOTS } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function VolunteerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("volunteers.view");
  const { id } = await params;
  const volunteer = getVolunteer(id);
  if (!volunteer) notFound();

  const departments = getDepartments(volunteer.event_id);
  const availability = (() => {
    try {
      return JSON.parse(volunteer.availability ?? "[]") as string[];
    } catch {
      return [];
    }
  })();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link
          href="/admin/volunteers"
          className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to volunteers
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xs bg-ink-900 text-sm font-bold text-white">
            {initials(volunteer.full_name)}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink-900">
              {volunteer.full_name}
            </h1>
            <p className="mt-0.5 font-mono text-[0.6875rem] text-ink-400">{volunteer.reference}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge
                tone={STATUS_TONES[volunteer.status] ?? "neutral"}
                label={STATUS_LABELS[volunteer.status] ?? volunteer.status}
              />
              <span className="text-[0.625rem] text-ink-400">
                Applied {formatStamp(volunteer.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Application content */}
        <div className="space-y-4">
          <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
            <h2 className="text-[0.8125rem] font-semibold text-ink-900">Contact</h2>
            <dl className="mt-3 space-y-2.5">
              <div className="flex items-center gap-2.5 text-[0.8125rem]">
                <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                <a href={`mailto:${volunteer.email}`} className="text-ink-800 hover:text-violet-600">
                  {volunteer.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-[0.8125rem]">
                <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                <a href={`tel:${volunteer.phone}`} className="tabular-nums text-ink-800 hover:text-violet-600">
                  {volunteer.phone}
                </a>
                {volunteer.whatsapp && (
                  <span className="text-[0.625rem] text-ink-400">· WhatsApp {volunteer.whatsapp}</span>
                )}
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
            <h2 className="text-[0.8125rem] font-semibold text-ink-900">Department preferences</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xs bg-paper-50 p-3">
                <p className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  First choice
                </p>
                <p className="mt-1 text-[0.8125rem] font-medium text-ink-900">
                  {departments.find((d) => d.id === volunteer.department_id)?.name ?? "-"}
                </p>
              </div>
              <div className="rounded-xs bg-paper-50 p-3">
                <p className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  Second choice
                </p>
                <p className="mt-1 text-[0.8125rem] font-medium text-ink-900">
                  {departments.find((d) => d.id === volunteer.second_choice_id)?.name ?? "None"}
                </p>
              </div>
            </div>

            <h3 className="mt-4 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Availability
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {availability.length === 0 ? (
                <span className="text-[0.75rem] text-ink-400">Not specified</span>
              ) : (
                availability.map((slot) => (
                  <span
                    key={slot}
                    className="inline-flex items-center gap-1 rounded-xs bg-emerald-50 px-2.5 py-1 text-[0.6875rem] font-medium text-emerald-700"
                  >
                    <Clock className="h-2.5 w-2.5" strokeWidth={2.6} />
                    {AVAILABILITY_SLOTS.find((s) => s.id === slot)?.label ?? slot}
                  </span>
                ))
              )}
            </div>
          </div>

          {volunteer.experience && (
            <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
              <h2 className="text-[0.8125rem] font-semibold text-ink-900">Experience</h2>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-600">{volunteer.experience}</p>
            </div>
          )}

          <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
            <h2 className="text-[0.8125rem] font-semibold text-ink-900">Why they want to serve</h2>
            <blockquote className="mt-2 border-l-2 border-violet-600/30 pl-3">
              <p className="text-[0.8125rem] italic leading-relaxed text-ink-600">
                {volunteer.motivation}
              </p>
            </blockquote>
          </div>
        </div>

        {/* Review panel */}
        <div>
          {can(user.role, "volunteers.manage") ? (
            <VolunteerReviewPanel
              volunteerId={volunteer.id}
              initialStatus={volunteer.status}
              initialDepartment={volunteer.department_id ?? ""}
              initialNotes={volunteer.internal_notes ?? ""}
              departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            />
          ) : (
            <div className="rounded-sm border border-ink-900/[0.08] bg-white p-5">
              <p className="text-[0.75rem] leading-relaxed text-ink-500">
                You have read-only access. A volunteer coordinator can update this application.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
