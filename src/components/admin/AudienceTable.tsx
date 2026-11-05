"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Mail, Check, Minus } from "lucide-react";

type Person = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  source: string;
  subscribed: number;
  registrations: number;
  events_attended: number;
  lastLabel: string;
};

const PAGE = 25;

export function AudienceTable({ people }: { people: Person[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(0);

  const pageRows = useMemo(
    () => people.slice(page * PAGE, page * PAGE + PAGE),
    [people, page]
  );
  const pages = Math.ceil(people.length / PAGE);

  function applySearch(v: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (v) next.set("q", v);
    else next.delete("q");
    setPage(0);
    router.push(`/admin/audience?${next.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-sm border border-ink-900/[0.08] bg-white p-3 sm:flex-row">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applySearch(q);
          }}
          className="relative flex-1"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" strokeWidth={2.2} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email, name or phone..."
            aria-label="Search audience"
            className="h-9 w-full rounded-xs border border-ink-900/10 bg-paper-50 pl-9 pr-3 text-[0.8125rem] focus:border-ink-900 focus:bg-white focus:outline-none"
          />
        </form>
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(searchParams.toString());
            if (searchParams.get("subscribed") === "1") next.delete("subscribed");
            else next.set("subscribed", "1");
            setPage(0);
            router.push(`/admin/audience?${next.toString()}`);
          }}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xs border px-3 text-[0.75rem] font-semibold transition-colors ${
            searchParams.get("subscribed") === "1"
              ? "border-emerald-500/40 bg-emerald-50 text-emerald-700"
              : "border-ink-900/10 bg-paper-50 text-ink-600 hover:text-ink-900"
          }`}
        >
          <Mail className="h-3.5 w-3.5" strokeWidth={2.2} />
          Subscribed only
        </button>
      </div>

      <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-ink-900/[0.07] bg-paper-50/60">
                {["Person", "Source", "Marketing", "Events", "Last seen"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3.5 py-2 text-left text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/[0.05]">
              {pageRows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-paper-50">
                  <td className="px-3.5 py-2.5">
                    <p className="text-[0.8125rem] font-medium text-ink-900">{p.full_name ?? "-"}</p>
                    <p className="text-[0.6875rem] text-ink-400">{p.email}</p>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="rounded bg-ink-900/[0.05] px-1.5 py-0.5 text-[0.625rem] capitalize text-ink-600">
                      {p.source.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    {p.subscribed ? (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-emerald-700">
                        <Check className="h-3 w-3" strokeWidth={3} />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] text-ink-400">
                        <Minus className="h-3 w-3" />
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[0.75rem] tabular-nums text-ink-700">
                      {p.registrations}
                      <span className="text-ink-400"> / {p.events_attended} attended</span>
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-[0.6875rem] text-ink-400">{p.lastLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-ink-900/[0.07] px-3.5 py-2.5">
          <p className="text-[0.6875rem] text-ink-400">
            {people.length === 0
              ? "No contacts"
              : `${page * PAGE + 1}–${Math.min((page + 1) * PAGE, people.length)} of ${people.length}`}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-ink-900/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-ink-600 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="rounded-md border border-ink-900/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-ink-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
