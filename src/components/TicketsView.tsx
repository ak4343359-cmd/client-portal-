"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import type { Profile, Ticket, Status } from "@/lib/types";
import { STATUS, CATEGORIES, STATUS_KEYS } from "@/lib/constants";
import { ticketCode, timeAgo } from "@/lib/format";
import { StatusBadge, SlaBadge, Avatar } from "@/components/Badges";
import { Icon } from "@/components/Icon";
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
    { label: "Active", value: active, sub: "open + WIP + hold", color: "text-vibrant-blue" },
    { label: "Open", value: cnt("open"), sub: "unstarted", color: "text-[#1a73e8]" },
    { label: "In Progress", value: cnt("in_progress"), sub: "WIP", color: "text-[#b06000]" },
    { label: "Resolved", value: cnt("resolved"), sub: "awaiting confirm", color: "text-[#137333]" },
    isStaff
      ? {
          label: "Unassigned",
          value: tickets.filter((t) => !t.assigned_to && t.status !== "closed").length,
          sub: "need owner",
          color: "text-slate-gray",
        }
      : { label: "Closed", value: cnt("closed"), sub: "done", color: "text-slate-gray" },
  ];

  const selectCls =
    "bg-white border border-outline-variant rounded-lg px-3 py-2 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-deep-navy">Support Tickets</h2>
          <p className="text-slate-gray text-sm mt-1">
            {isStaff ? "Track, assign, and resolve client support requests." : "View and follow up on your support requests."}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-deep-navy text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-vibrant-blue transition-colors shadow-sm"
        >
          <Icon name="add" className="text-[18px]" />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-surface-variant rounded-xl p-5">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm font-semibold text-deep-navy mt-1">{s.label}</div>
            <div className="text-xs text-slate-gray">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-gray text-[20px]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tickets…"
            className="w-full bg-white border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue"
          />
        </div>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>{STATUS[s].label}</option>
          ))}
        </select>
        {isStaff && (
          <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className={selectCls}>
            <option value="">All assignees</option>
            <option value="__unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/tickets/${t.id}`}
            className="group bg-white border border-surface-variant rounded-xl p-4 hover:border-vibrant-blue hover:shadow-[0_4px_12px_rgba(0,33,71,0.08)] transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-[#e8f0fe] text-vibrant-blue grid place-items-center shrink-0">
              <Icon name="confirmation_number" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-gray font-mono">{t.reference ?? ticketCode(t.id)}</span>
                <StatusBadge status={t.status} />
                <SlaBadge ticket={t} />
                <span className="text-xs text-slate-gray">· {t.category}</span>
              </div>
              <div className="text-deep-navy font-semibold mt-1 truncate group-hover:text-vibrant-blue transition-colors">
                {t.subject}
              </div>
              <div className="text-sm text-slate-gray mt-0.5 truncate">{t.description}</div>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-gray">
                {isStaff && <span>from {byId[t.created_by]?.full_name ?? "—"}</span>}
                <span className="inline-flex items-center gap-1">
                  <Icon name="chat_bubble" className="text-[14px]" /> {messageCounts[t.id] ?? 0}
                </span>
                <span suppressHydrationWarning>updated {timeAgo(t.updated_at)}</span>
              </div>
            </div>
            <div className="shrink-0">
              {t.assigned_to ? (
                <Avatar name={byId[t.assigned_to]?.full_name} size="h-9 w-9" />
              ) : (
                <span className="text-xs font-medium text-[#b06000] border border-[#fce8b2] bg-[#fef7e0] rounded-full px-2.5 py-1">
                  Unassigned
                </span>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-gray bg-white border border-surface-variant rounded-xl">
            <Icon name="inbox" className="text-[40px] text-outline-variant" />
            <p className="mt-2">No tickets match your filters.</p>
          </div>
        )}
      </div>

      {showNew && <NewTicketModal isStaff={isStaff} clients={clients} onClose={() => setShowNew(false)} />}
    </div>
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
  const inputCls =
    "w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form action={formAction} className="relative bg-white border border-surface-variant rounded-xl w-full max-w-lg p-6 fade space-y-4 shadow-xl">
        <h2 className="text-lg font-bold text-deep-navy">New Support Ticket</h2>
        {isStaff && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1">Requester (client)</label>
            <select name="requester" className={inputCls}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1">Subject</label>
          <input name="subject" required className={inputCls} placeholder="e.g. Camera 3 in warehouse is offline" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1">Category</label>
          <select name="category" className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1">Description</label>
          <textarea name="description" rows={4} className={inputCls} placeholder="Describe the issue, when it started, and any error messages…" />
        </div>
        {state?.error && <p className="text-sm text-[#ba1a1a]">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-gray border border-outline-variant rounded-lg px-4 py-2 hover:bg-surface-container-low">
            Cancel
          </button>
          <button type="submit" className="bg-deep-navy hover:bg-vibrant-blue text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors">
            Submit ticket
          </button>
        </div>
      </form>
    </div>
  );
}
