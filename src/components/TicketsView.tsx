"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import type { Profile, Ticket, Status } from "@/lib/types";
import { STATUS, CATEGORIES, STATUS_KEYS } from "@/lib/constants";
import { ticketCode, timeAgo } from "@/lib/format";
import { StatusBadge, SlaBadge, Avatar } from "@/components/Badges";
import { createTicket } from "@/app/(portal)/tickets/actions";

export default function TicketsView({
  isStaff,
  tickets,
  profiles,
  messageCounts,
}: {
  isStaff: boolean;
  tickets: Ticket[];
  profiles: Profile[];
  messageCounts: Record<number, number>;
}) {
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fAssignee, setFAssignee] = useState("");
  const [showNew, setShowNew] = useState(false);

  const byId = useMemo(() => {
    const m: Record<string, Profile> = {};
    profiles.forEach((p) => (m[p.id] = p));
    return m;
  }, [profiles]);

  const agents = profiles.filter((p) => p.role !== "client");
  const clients = profiles.filter((p) => p.role === "client");

  const filtered = tickets.filter((t) => {
    if (q && !(`${t.subject} ${t.description ?? ""} ${t.reference ?? ticketCode(t.id)}`.toLowerCase().includes(q.toLowerCase())))
      return false;
    if (fStatus && t.status !== fStatus) return false;
    if (fAssignee) {
      if (fAssignee === "__unassigned" ? t.assigned_to : t.assigned_to !== fAssignee) return false;
    }
    return true;
  });

  const active = tickets.filter((t) => ["open", "in_progress", "on_hold"].includes(t.status)).length;
  const cnt = (s: Status) => tickets.filter((t) => t.status === s).length;
  const stats = [
    { label: "Active", value: active, sub: "open + WIP + hold", color: "text-brand" },
    { label: "Open", value: cnt("open"), sub: "unstarted", color: "text-blue-300" },
    { label: "In Progress", value: cnt("in_progress"), sub: "WIP", color: "text-amber-300" },
    { label: "Resolved", value: cnt("resolved"), sub: "awaiting confirm", color: "text-emerald-300" },
    isStaff
      ? {
          label: "Unassigned",
          value: tickets.filter((t) => !t.assigned_to && t.status !== "closed").length,
          sub: "need owner",
          color: "text-slate-300",
        }
      : { label: "Closed", value: cnt("closed"), sub: "done", color: "text-slate-300" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-panel border border-edge rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-white mt-0.5">{s.label}</div>
            <div className="text-[11px] text-slate-500">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tickets…"
          className="flex-1 bg-panel border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
        />
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="bg-panel border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
          <option value="">All statuses</option>
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>{STATUS[s].label}</option>
          ))}
        </select>
        {isStaff && (
          <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className="bg-panel border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
            <option value="">All assignees</option>
            <option value="__unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
        )}
        <button onClick={() => setShowNew(true)} className="bg-brand hover:bg-teal-300 text-ink font-semibold rounded-lg px-4 py-2 text-sm whitespace-nowrap">
          + New Ticket
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/tickets/${t.id}`}
            className="group bg-panel hover:border-brand border border-edge rounded-xl p-4 cursor-pointer transition flex items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-mono">{t.reference ?? ticketCode(t.id)}</span>
                <StatusBadge status={t.status} />
                <SlaBadge ticket={t} />
                <span className="text-[11px] text-slate-500">· {t.category}</span>
              </div>
              <div className="text-white font-medium mt-1 truncate group-hover:text-brand">{t.subject}</div>
              <div className="text-sm text-slate-400 mt-0.5 truncate">{t.description}</div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                {isStaff && <span>from {byId[t.created_by]?.full_name ?? "—"}</span>}
                <span>💬 {messageCounts[t.id] ?? 0}</span>
                <span suppressHydrationWarning>updated {timeAgo(t.updated_at)}</span>
              </div>
            </div>
            <div className="shrink-0">
              {t.assigned_to ? (
                <Avatar name={byId[t.assigned_to]?.full_name} size="h-8 w-8" color="bg-sky-500/20 text-sky-300" />
              ) : (
                <span className="text-[11px] text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded-full px-2 py-0.5">
                  Unassigned
                </span>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-2">🎫</div>
            <p>No tickets match your filters.</p>
          </div>
        )}
      </div>

      {showNew && (
        <NewTicketModal isStaff={isStaff} clients={clients} onClose={() => setShowNew(false)} />
      )}
    </>
  );
}

function NewTicketModal({
  isStaff,
  clients,
  onClose,
}: {
  isStaff: boolean;
  clients: Profile[];
  onClose: () => void;
}) {
  const [state, formAction] = useFormState(createTicket, null as { error?: string } | null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form action={formAction} className="relative bg-panel border border-edge rounded-2xl w-full max-w-lg p-6 fade space-y-3">
        <h2 className="text-lg font-semibold text-white">New Support Ticket</h2>
        {isStaff && (
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Requester (client)</label>
            <select name="requester" className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Subject</label>
          <input name="subject" required className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" placeholder="e.g. Camera 3 in warehouse is offline" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Category</label>
          <select name="category" className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Description</label>
          <textarea name="description" rows={4} className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" placeholder="Describe the issue, when it started, and any error messages…" />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm text-slate-300 border border-edge rounded-lg px-4 py-2 hover:bg-panel2">Cancel</button>
          <button type="submit" className="bg-brand hover:bg-teal-300 text-ink font-semibold rounded-lg px-4 py-2 text-sm">Submit ticket</button>
        </div>
      </form>
    </div>
  );
}
