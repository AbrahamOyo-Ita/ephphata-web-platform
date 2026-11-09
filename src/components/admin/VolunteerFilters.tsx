"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

export function VolunteerFilters({
  departments,
  current,
}: {
  departments: { id: string; name: string }[];
  current: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(current.q ?? "");

  function apply(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    router.push(`/admin/volunteers?${next.toString()}`);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-sm border border-ink-900/[0.08] bg-white p-3 sm:flex-row">
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
          placeholder="Search name, email or reference..."
          aria-label="Search volunteers"
          className="h-9 w-full rounded-xs border border-ink-900/10 bg-paper-50 pl-9 pr-3 text-[0.8125rem] text-ink-900 placeholder:text-ink-300 focus:border-ink-900 focus:bg-white focus:outline-none"
        />
      </form>

      <CustomSelect
        value={current.department ?? ""}
        onChange={(value) => apply({ department: value })}
        aria-label="Filter by department"
        className="min-w-[10rem]"
        options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
      />

      <CustomSelect
        value={current.status ?? ""}
        onChange={(value) => apply({ status: value })}
        aria-label="Filter by status"
        className="min-w-[10rem]"
        options={[
          { value: "", label: "All statuses" },
          { value: "submitted", label: "Submitted" },
          { value: "under_review", label: "Under review" },
          { value: "accepted", label: "Accepted" },
          { value: "waitlisted", label: "Waitlisted" },
          { value: "declined", label: "Declined" },
        ]}
      />
    </div>
  );
}
