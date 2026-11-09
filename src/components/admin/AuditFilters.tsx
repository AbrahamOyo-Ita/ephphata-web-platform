"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

export function AuditFilters({
  actions,
  current,
}: {
  actions: string[];
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
    router.push(`/admin/audit?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-ink-900/[0.08] bg-white p-3 sm:flex-row">
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
          placeholder="Search actor, action or entity..."
          aria-label="Search audit log"
          className="h-9 w-full rounded-xs border border-ink-900/10 bg-paper-50 pl-9 pr-3 text-[0.8125rem] focus:border-ink-900 focus:bg-white focus:outline-none"
        />
      </form>

      <CustomSelect
        value={current.action ?? ""}
        onChange={(value) => apply({ action: value })}
        aria-label="Filter by action"
        className="min-w-[12rem]"
        options={[{ value: "", label: "All actions" }, ...actions.map((action) => ({ value: action, label: action.replace(/\./g, " · ") }))]}
      />
    </div>
  );
}
