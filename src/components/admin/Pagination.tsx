import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  baseHref,
  params,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  baseHref: string;
  params: Record<string, string | undefined>;
}) {
  const build = (p: number) => {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== "page") search.set(k, v);
    }
    if (p > 1) search.set("page", String(p));
    const qs = search.toString();
    return `${baseHref}${qs ? `?${qs}` : ""}`;
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Compact window: first, current ±1, last
  const windowed: (number | "…")[] = [];
  for (let p = 1; p <= pages; p += 1) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) windowed.push(p);
    else if (windowed[windowed.length - 1] !== "…") windowed.push("…");
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-900/[0.07] px-4 py-3 sm:flex-row">
      <p className="text-[0.6875rem] text-ink-400">
        Showing <span className="font-semibold text-ink-700">{from}–{to}</span> of{" "}
        <span className="font-semibold text-ink-700">{total}</span>
      </p>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Link
            href={build(Math.max(1, page - 1))}
            aria-label="Previous page"
            aria-disabled={page === 1}
            className={`grid h-7 w-7 place-items-center rounded-md text-ink-500 transition-colors ${
              page === 1 ? "pointer-events-none opacity-30" : "hover:bg-ink-900/5 hover:text-ink-900"
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>

          {windowed.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-[0.6875rem] text-ink-300">
                ...
              </span>
            ) : (
              <Link
                key={p}
                href={build(p)}
                aria-current={p === page ? "page" : undefined}
                className={`grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-[0.6875rem] font-semibold transition-colors ${
                  p === page
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
                }`}
              >
                {p}
              </Link>
            )
          )}

          <Link
            href={build(Math.min(pages, page + 1))}
            aria-label="Next page"
            aria-disabled={page === pages}
            className={`grid h-7 w-7 place-items-center rounded-md text-ink-500 transition-colors ${
              page === pages ? "pointer-events-none opacity-30" : "hover:bg-ink-900/5 hover:text-ink-900"
            }`}
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </nav>
      )}
    </div>
  );
}
