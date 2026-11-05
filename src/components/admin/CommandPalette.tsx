"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";

type NavItemLike = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

/**
 * Keyboard-first navigation (⌘K / Ctrl+K).
 * Arrow keys move, Enter navigates, Escape closes, focus is trapped and
 * restored on close - required for an accessible dialog.
 */
export function CommandPalette({
  open,
  onClose,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavItemLike[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nav;
    return nav.filter((item) => item.label.toLowerCase().includes(q));
  }, [nav, query]);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      window.setTimeout(() => inputRef.current?.focus(), 40);
      setQuery("");
      setCursor(0);
    } else {
      previouslyFocused.current?.focus?.();
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search and navigate"
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/40"
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-lg overflow-hidden rounded-md border border-ink-900/10 bg-white"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(results.length - 1, c + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(0, c - 1));
          }
          if (e.key === "Enter" && results[cursor]) {
            e.preventDefault();
            go(results[cursor].href);
          }
        }}
      >
        <div className="flex items-center gap-2.5 border-b border-ink-900/[0.07] px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2.2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page..."
            aria-label="Search pages"
            className="h-12 w-full bg-transparent text-[0.875rem] text-ink-900 placeholder:text-ink-300 focus:outline-none"
          />
          <kbd className="shrink-0 rounded border border-ink-900/15 px-1.5 py-0.5 text-[0.5625rem] font-semibold text-ink-400">
            ESC
          </kbd>
        </div>

        <ul className="max-h-[320px] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-[0.8125rem] text-ink-400">
              No pages match “{query}”.
            </li>
          ) : (
            results.map((item, i) => (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setCursor(i)}
                  className={`flex w-full items-center gap-2.5 rounded-xs px-2.5 py-2 text-left text-[0.8125rem] transition-colors ${
                    i === cursor ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-paper-100"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 shrink-0 ${i === cursor ? "text-white" : "text-ink-400"}`}
                    strokeWidth={2}
                  />
                  {item.label}
                  {i === cursor && (
                    <CornerDownLeft className="ml-auto h-3.5 w-3.5 opacity-60" />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-ink-900/[0.07] bg-paper-50 px-4 py-2 text-[0.5625rem] font-medium text-ink-400">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-2.5 w-2.5" />
            <ArrowDown className="h-2.5 w-2.5" /> navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-2.5 w-2.5" /> open
          </span>
        </div>
      </div>
    </div>
  );
}
