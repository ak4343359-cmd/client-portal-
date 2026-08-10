import { STATUS, PRIORITY } from "@/lib/constants";
import { slaState, slaLabel, SLA_CLASSES } from "@/lib/sla";
import type { Status, Priority, Ticket } from "@/lib/types";

export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${m.cls}`}>
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = PRIORITY[priority];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${m.cls}`}>
      {m.label}
    </span>
  );
}

export function SlaBadge({ ticket }: { ticket: Ticket }) {
  const state = slaState(ticket);
  if (state === "none" || state === "ok") return null;
  const label = slaLabel(state, ticket);
  if (!label) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${SLA_CLASSES[state]}`}>
      {state === "overdue" && "⚠ "}
      {label}
    </span>
  );
}

export function Avatar({
  name,
  size = "h-7 w-7",
  color = "bg-slate-700 text-slate-200",
}: {
  name: string | null | undefined;
  size?: string;
  color?: string;
}) {
  const init = name
    ? name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <span
      title={name ?? undefined}
      className={`${size} ${color} rounded-full grid place-items-center text-[10px] font-semibold shrink-0`}
    >
      {init}
    </span>
  );
}
