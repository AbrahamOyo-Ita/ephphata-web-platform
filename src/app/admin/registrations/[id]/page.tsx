import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  QrCode,
  CheckCircle2,
  Copy,
  CalendarDays,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getRegistrationForAdmin } from "@/lib/data/admin-registrations";
import { formatStamp, formatRelative } from "@/lib/format";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "@/components/admin/StatusBadge";
import { RegistrationActions } from "@/components/admin/RegistrationActions";

export const dynamic = "force-dynamic";

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("registrations.view");
  const { id } = await params;
  const reg = getRegistrationForAdmin(id);
  if (!reg) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/registrations"
        className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to registrations
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={STATUS_TONES[reg.status] ?? "neutral"}
              label={STATUS_LABELS[reg.status] ?? reg.status}
            />
            {reg.checked_in_at && (
              <span className="inline-flex items-center gap-1 rounded-xs bg-emerald-50 px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={3} />
                Checked in
              </span>
            )}
          </div>
          <h1 className="mt-2 text-[1.375rem] font-semibold tracking-[-0.02em] text-ink-900">
            {reg.first_name} {reg.last_name}
          </h1>
          <p className="mt-0.5 font-mono text-[0.75rem] text-ink-400">{reg.reference}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <h2 className="text-[0.8125rem] font-semibold text-ink-900">Contact</h2>
          <dl className="mt-2.5 space-y-2">
            <div className="flex items-center gap-2 text-[0.8125rem]">
              <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
              <a href={`mailto:${reg.email}`} className="truncate text-ink-800 hover:text-violet-600">
                {reg.email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem]">
              <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
              <a href={`tel:${reg.phone}`} className="tabular-nums text-ink-800 hover:text-violet-600">
                {reg.phone}
              </a>
            </div>
            {reg.whatsapp && reg.whatsapp !== reg.phone && (
              <div className="flex items-center gap-2 text-[0.8125rem]">
                <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                <span className="tabular-nums text-ink-600">WhatsApp {reg.whatsapp}</span>
              </div>
            )}
            {reg.city && (
              <div className="flex items-center gap-2 text-[0.8125rem]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                <span className="text-ink-600">{reg.city}</span>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <h2 className="text-[0.8125rem] font-semibold text-ink-900">Registration</h2>
          <dl className="mt-2.5 space-y-1.5">
            {[
              { k: "Event", v: reg.event_title },
              { k: "Attendance", v: reg.attendance_intent.replace("_", " ") },
              { k: "Heard via", v: (reg.heard_via ?? "-").replace(/_/g, " ") },
              { k: "Source", v: `${reg.source}-registered` },
              { k: "Registered", v: formatStamp(reg.created_at) },
            ].map((row) => (
              <div key={row.k} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-[0.625rem] uppercase tracking-wide text-ink-400">{row.k}</dt>
                <dd className="truncate text-right text-[0.75rem] capitalize text-ink-800">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Consent */}
      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
        <h2 className="text-[0.8125rem] font-semibold text-ink-900">Communication consent</h2>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
          {[
            { k: "Event email", v: reg.comm_email },
            { k: "WhatsApp", v: reg.comm_whatsapp },
            { k: "Newsletter", v: reg.comm_newsletter },
          ].map((c) => (
            <div
              key={c.k}
              className={`rounded-xs px-3 py-2 ${
                c.v ? "bg-emerald-50 text-emerald-800" : "bg-paper-50 text-ink-400"
              }`}
            >
              <p className="text-[0.625rem] font-semibold uppercase tracking-wide">{c.k}</p>
              <p className="text-[0.75rem] font-medium">{c.v ? "Granted" : "Not granted"}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[0.625rem] leading-relaxed text-ink-400">
          Consent is recorded per purpose at the moment of registration. Newsletter consent is never
          inferred from event registration.
        </p>
      </div>

      {/* Attendance / QR */}
      <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
        <h2 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
          <QrCode className="h-3.5 w-3.5 text-ink-400" strokeWidth={2.2} />
          Attendance
        </h2>
        {reg.checked_in_at ? (
          <div className="mt-2.5 flex items-center gap-2.5 rounded-xs bg-emerald-50 px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.6} />
            <div>
              <p className="text-[0.75rem] font-semibold text-emerald-800">Checked in</p>
              <p className="text-[0.625rem] text-ink-600">
                {formatStamp(reg.checked_in_at)}
                {reg.checkin_method && ` · via ${reg.checkin_method}`}
                {reg.checkin_gate && ` · ${reg.checkin_gate}`}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 rounded-xs bg-paper-50 px-3 py-2.5 text-[0.75rem] text-ink-500">
            This attendee has not been checked in yet.
          </p>
        )}

        <div className="mt-3 flex items-start gap-2 rounded-xs border border-ink-900/[0.08] p-3">
          <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" strokeWidth={2} />
          <p className="text-[0.625rem] leading-relaxed text-ink-500">
            The QR code encodes an opaque token, not personal data. If an attendee has lost their
            pass, use the reference above at the check-in desk - no need to reveal their details over
            the phone.
          </p>
        </div>
      </div>

      {reg.notes && (
        <div className="rounded-sm border border-ink-900/[0.08] bg-white p-4">
          <h2 className="text-[0.8125rem] font-semibold text-ink-900">Internal note</h2>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-600">{reg.notes}</p>
        </div>
      )}

      {can(user.role, "registrations.manage") && (
        <RegistrationActions
          id={reg.id}
          status={reg.status}
          checkedIn={Boolean(reg.checked_in_at)}
          reference={reg.reference}
        />
      )}
    </div>
  );
}
