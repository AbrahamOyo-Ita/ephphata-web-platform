"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Lock, Mail, Phone, Loader2, Eye, EyeOff } from "lucide-react";
import { StatusBadge, STATUS_TONES, STATUS_LABELS } from "./StatusBadge";

type PrayerItem = {
  id: string;
  reference: string;
  displayName: string;
  isAnonymous: boolean;
  request: string;
  category: string | null;
  status: string;
  allowFollowUp: boolean;
  email: string | null;
  phone: string | null;
  createdAt: string;
  createdLabel: string;
  internalNotes: string | null;
};

const STATUS_FLOW = ["received", "in_prayer", "follow_up", "answered", "archived"] as const;

export function PrayerList({
  requests,
  canManage,
}: {
  requests: PrayerItem[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {requests.map((r) => (
        <PrayerCard key={r.id} item={r} canManage={canManage} />
      ))}
    </div>
  );
}

function PrayerCard({ item, canManage }: { item: PrayerItem; canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [revealContact, setRevealContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(item.internalNotes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  async function update(status: string) {
    setSaving(true);
    try {
      await fetch("/api/admin/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status, internalNotes: notesDirty ? notes : undefined }),
      });
      setNotesDirty(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-sm border border-ink-900/[0.08] bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper-50"
      >
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xs bg-violet-50">
          <Lock className="h-3 w-3 text-ink-400" strokeWidth={2.4} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.8125rem] font-semibold text-ink-900">{item.displayName}</p>
            <StatusBadge tone={STATUS_TONES[item.status] ?? "neutral"} label={STATUS_LABELS[item.status] ?? item.status} />
            {item.allowFollowUp && (
              <span className="rounded-xs bg-gold-500/15 px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-gold-700">
                Follow-up OK
              </span>
            )}
            {item.isAnonymous && (
              <span className="text-[0.5625rem] font-semibold uppercase tracking-wide text-ink-400">
                Anonymous
              </span>
            )}
          </div>
          <p className={`mt-1 text-[0.75rem] leading-relaxed text-ink-600 ${open ? "" : "line-clamp-1"}`}>
            {item.request}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[0.625rem] text-ink-400">
            <span className="font-mono">{item.reference}</span>
            <span className="h-1 w-1 rounded-xs bg-ink-300" />
            <span className="capitalize">{item.category ?? "other"}</span>
            <span className="h-1 w-1 rounded-xs bg-ink-300" />
            <span>{item.createdLabel}</span>
          </div>
        </div>

        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-ink-900/[0.07] bg-paper-50 px-4 py-4">
          <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-ink-700">
            {item.request}
          </p>

          {/* Contact - deliberately requires a second click to reveal */}
          {(item.email || item.phone) && (
            <div className="mt-3 rounded-xs border border-ink-900/10 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  Contact details
                </p>
                <button
                  type="button"
                  onClick={() => setRevealContact((v) => !v)}
                  className="inline-flex items-center gap-1 text-[0.625rem] font-semibold text-ink-900 underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {revealContact ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {revealContact ? "Hide" : "Reveal"}
                </button>
              </div>
              {revealContact ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                  {item.email && (
                    <a href={`mailto:${item.email}`} className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-800 hover:text-ink-900 hover:underline">
                      <Mail className="h-3 w-3 text-ink-400" />
                      {item.email}
                    </a>
                  )}
                  {item.phone && (
                    <a href={`tel:${item.phone}`} className="inline-flex items-center gap-1.5 text-[0.75rem] tabular-nums text-ink-800 hover:text-ink-900 hover:underline">
                      <Phone className="h-3 w-3 text-ink-400" />
                      {item.phone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-1.5 text-[0.6875rem] text-ink-400">
                  Hidden by default - reveal only if you are following up with this person.
                </p>
              )}
            </div>
          )}

          {canManage && (
            <>
              <div className="mt-3">
                <label htmlFor={`notes-${item.id}`} className="mb-1 block text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  Internal follow-up note
                </label>
                <textarea
                  id={`notes-${item.id}`}
                  rows={2}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setNotesDirty(true);
                  }}
                  placeholder="Prayed with on 12 Nov. Requested a call back."
                  className="input resize-y py-2 text-[0.75rem]"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  Move to:
                </span>
                {STATUS_FLOW.filter((s) => s !== item.status).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update(s)}
                    disabled={saving}
                    className="rounded-xs border border-ink-900/15 bg-white px-2.5 py-1 text-[0.6875rem] font-semibold capitalize text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white disabled:opacity-50"
                  >
                    {STATUS_LABELS[s] ?? s.replace("_", " ")}
                  </button>
                ))}
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
