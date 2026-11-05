"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

export function RegistrationFilters({
  events,
  current,
}: {
  events: { id: string; title: string }[];
  current: {
    event?: string;
    q?: string;
    status?: string;
    source?: string;
    attendance?: string;
    sort?: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(current.q ?? "");
  const [advanced, setAdvanced] = useState(
    Boolean(current.status || current.source || current.attendance)
  );

  function apply(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    next.delete("page"); // any filter change resets pagination
    startTransition(() => router.push(`/admin/registrations?${next.toString()}`));
  }

  const activeCount = [current.status, current.source, current.attendance].filter(Boolean).length;

  return (
    <div className="rounded-sm border border-ink-900/[0.08] bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: q || undefined });
          }}
          className="relative flex-1"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" strokeWidth={2.2} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone or reference..."
            aria-label="Search registrations"
            className="h-9 w-full rounded-xs border border-ink-900/10 bg-paper-50 pl-9 pr-3 text-[0.8125rem] text-ink-900 placeholder:text-ink-300 transition-colors focus:border-ink-900 focus:bg-white focus:outline-none focus:ring-2 "
          />
        </form>

        {/* Event scope */}
        <select
          value={current.event ?? ""}
          onChange={(e) => apply({ event: e.target.value })}
          aria-label="Filter by event"
          className="h-9 cursor-pointer rounded-xs border border-ink-900/10 bg-paper-50 px-2.5 text-[0.8125rem] text-ink-800 focus:border-ink-900 focus:outline-none"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setAdvanced((a) => !a)}
          aria-expanded={advanced}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xs border px-2.5 text-[0.8125rem] font-medium transition-colors ${
            activeCount > 0
              ? "border-ink-900/40 bg-ink-900/[0.05] text-ink-900"
              : "border-ink-900/10 bg-paper-50 text-ink-600 hover:border-ink-900/25"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.2} />
          Filters
          {activeCount > 0 && (
            <span className="rounded-xs bg-ink-900 px-1.5 text-[0.5625rem] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {(current.q || activeCount > 0) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              router.push(`/admin/registrations${current.event ? `?event=${current.event}` : ""}`);
            }}
            className="inline-flex h-9 items-center gap-1 rounded-xs px-2 text-[0.75rem] font-medium text-ink-400 transition-colors hover:text-ink-900"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {advanced && (
        <div className="mt-2.5 grid gap-2 border-t border-ink-900/[0.07] pt-2.5 sm:grid-cols-3">
          <Select
            label="Status"
            value={current.status ?? ""}
            onChange={(v) => apply({ status: v })}
            options={[
              ["", "All statuses"],
              ["confirmed", "Confirmed"],
              ["waitlisted", "Waitlisted"],
              ["cancelled", "Cancelled"],
            ]}
          />
          <Select
            label="Attendance"
            value={current.attendance ?? ""}
            onChange={(v) => apply({ attendance: v })}
            options={[
              ["", "Everyone"],
              ["checked_in", "Checked in"],
              ["not_checked_in", "Not yet arrived"],
            ]}
          />
          <Select
            label="Source"
            value={current.source ?? ""}
            onChange={(v) => apply({ source: v })}
            options={[
              ["", "All sources"],
              ["public", "Self-registered"],
              ["admin", "Registered by staff"],
              ["import", "Imported"],
            ]}
          />
        </div>
      )}

      {pending && (
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-xs bg-ink-900/5">
          <div className="h-full w-1/3 animate-[marquee_1s_linear_infinite] bg-ink-900" />
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full cursor-pointer rounded-xs border border-ink-900/10 bg-white px-2 text-[0.75rem] text-ink-800 focus:border-ink-900 focus:outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
