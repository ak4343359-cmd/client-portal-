import type { Ticket } from "./types";

export type SlaState = "none" | "ok" | "due_soon" | "overdue" | "met";

/** Compute the SLA badge state for a ticket's resolution deadline. */
export function slaState(t: Ticket): SlaState {
  if (t.status === "resolved" || t.status === "closed") return "met";
  if (!t.sla_resolve_due) return "none";
  const due = new Date(t.sla_resolve_due).getTime();
  const created = new Date(t.created_at).getTime();
  const now = Date.now();
  if (now > due) return "overdue";
  // within the last 25% of the window → "due soon"
  const window = due - created;
  if (now > due - window * 0.25) return "due_soon";
  return "ok";
}

export function slaLabel(state: SlaState, t: Ticket): string {
  switch (state) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    case "met":
      return "Within SLA";
    case "ok":
      return t.sla_resolve_due ? `Due ${timeUntil(t.sla_resolve_due)}` : "";
    default:
      return "";
  }
}

export const SLA_CLASSES: Record<SlaState, string> = {
  overdue: "bg-red-500/15 text-red-300 border-red-500/30",
  due_soon: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  ok: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  met: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  none: "hidden",
};

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const h = Math.round(diff / 3.6e6);
  if (h < 1) return "in <1h";
  if (h < 24) return `in ${h}h`;
  return `in ${Math.round(h / 24)}d`;
}
