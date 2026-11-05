"use client";

import { useState } from "react";
import { Copy, Check, Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex w-full items-center justify-center gap-2 rounded-xs bg-white px-4 py-2.5 text-[0.8125rem] font-semibold text-ink-900 transition-colors hover:bg-white/90"
    >
      <Printer className="h-3.5 w-3.5" strokeWidth={2.2} />
      Print / save as PDF
    </button>
  );
}

export function CopyReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked (insecure context / permissions) - select the text instead.
      const range = document.createRange();
      const el = document.getElementById("reference-text");
      if (el) {
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-xs border border-ink-900/15 px-3 py-1.5 text-[0.6875rem] font-semibold text-ink-700 transition-colors hover:border-ink-900/40 hover:bg-ink-900/[0.04]"
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" strokeWidth={2.2} />
          Copy
        </>
      )}
    </button>
  );
}
