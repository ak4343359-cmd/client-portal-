"use client";

import { useEffect, useState, useTransition } from "react";
import type { Status } from "@/lib/types";
import { STATUS_KEYS, STATUS } from "@/lib/constants";
import { changeStatus, changeAssignee } from "@/app/(portal)/tickets/actions";

function SaveButton({
  dirty,
  pending,
  saved,
  onClick,
}: {
  dirty: boolean;
  pending: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!dirty || pending}
      className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed bg-brand hover:bg-teal-300 text-ink"
    >
      {pending ? "Saving…" : saved && !dirty ? "Saved ✓" : "Save"}
    </button>
  );
}

export function StatusSelect({ ticketId, value }: { ticketId: number; value: Status }) {
  const [sel, setSel] = useState<Status>(value);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  useEffect(() => setSel(value), [value]); // sync when server revalidates
  const dirty = sel !== value;

  return (
    <div className="flex gap-2">
      <select
        value={sel}
        disabled={pending}
        onChange={(e) => setSel(e.target.value as Status)}
        className="w-full bg-panel border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand disabled:opacity-60"
      >
        {STATUS_KEYS.map((s) => (
          <option key={s} value={s}>
            {STATUS[s].label}
          </option>
        ))}
      </select>
      <SaveButton
        dirty={dirty}
        pending={pending}
        saved={saved}
        onClick={() => start(async () => {
          await changeStatus(ticketId, sel);
          setSaved(true);
        })}
      />
    </div>
  );
}

export function AssigneeSelect({
  ticketId,
  value,
  agents,
}: {
  ticketId: number;
  value: string | null;
  agents: { id: string; full_name: string | null }[];
}) {
  const [sel, setSel] = useState<string>(value ?? "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  useEffect(() => setSel(value ?? ""), [value]);
  const dirty = sel !== (value ?? "");

  return (
    <div className="flex gap-2">
      <select
        value={sel}
        disabled={pending}
        onChange={(e) => setSel(e.target.value)}
        className="w-full bg-panel border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand disabled:opacity-60"
      >
        <option value="">— Unassigned —</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.full_name}
          </option>
        ))}
      </select>
      <SaveButton
        dirty={dirty}
        pending={pending}
        saved={saved}
        onClick={() => start(async () => {
          await changeAssignee(ticketId, sel || null);
          setSaved(true);
        })}
      />
    </div>
  );
}
