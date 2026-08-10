"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Profile, Role } from "@/lib/types";
import { Avatar } from "@/components/Badges";
import { addEmployee, setRole } from "@/app/(portal)/team/actions";

const ROLE_LABEL: Record<Role, string> = { client: "Client", agent: "Agent", admin: "Admin" };
const ROLE_CLS: Record<Role, string> = {
  admin: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  agent: "text-teal-300 border-teal-500/30 bg-teal-500/10",
  client: "text-slate-300 border-slate-500/30 bg-slate-500/10",
};

function AddBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand hover:bg-teal-300 disabled:opacity-60 text-ink font-semibold rounded-lg px-4 py-2 text-sm"
    >
      {pending ? "Adding…" : "Add employee"}
    </button>
  );
}

export default function TeamManager({
  profiles,
  currentUserId,
  serviceKeySet,
}: {
  profiles: Profile[];
  currentUserId: string;
  serviceKeySet: boolean;
}) {
  const [state, formAction] = useFormState(addEmployee, null as { error?: string; message?: string } | null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-white font-semibold text-xl">Team</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand hover:bg-teal-300 text-ink font-semibold rounded-lg px-4 py-2 text-sm"
        >
          {showForm ? "Close" : "+ Add employee"}
        </button>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Invite employees and set who is an agent or admin. Clients never appear as assignees.
      </p>

      {!serviceKeySet && (
        <div className="mb-4 text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          ⚠ <strong>SUPABASE_SERVICE_ROLE_KEY</strong> is not set in <code>.env.local</code>, so adding
          employees and changing roles won&apos;t work yet. Add it and restart the dev server.
        </div>
      )}

      {showForm && (
        <form action={formAction} className="bg-panel border border-edge rounded-xl p-4 mb-6 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Full name</label>
            <input name="full_name" placeholder="James Tran" className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Email</label>
            <input name="email" type="email" required placeholder="james@rdbit.net" className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Temporary password</label>
            <input name="password" required placeholder="At least 6 characters" className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Role</label>
            <select name="role" defaultValue="agent" className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <div className="text-sm">
              {state?.error && <span className="text-red-400">{state.error}</span>}
              {state?.message && <span className="text-emerald-300">{state.message}</span>}
            </div>
            <AddBtn />
          </div>
        </form>
      )}

      <div className="bg-panel border border-edge rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400 border-b border-edge">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Set role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <UserRow key={p.id} profile={p} isSelf={p.id === currentUserId} disabled={!serviceKeySet} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ profile, isSelf, disabled }: { profile: Profile; isSelf: boolean; disabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <tr className="border-b border-edge/60 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={profile.full_name} color="bg-teal-500/20 text-teal-300" />
          <span className="text-white">{profile.full_name ?? "—"}</span>
          {isSelf && <span className="text-[10px] text-slate-500">(you)</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{profile.email}</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_CLS[profile.role]}`}>
          {ROLE_LABEL[profile.role]}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <select
          defaultValue={profile.role}
          disabled={pending || disabled || isSelf}
          onChange={(e) => start(() => setRole(profile.id, e.target.value as Role))}
          title={isSelf ? "You can't change your own role" : undefined}
          className="bg-panel2 border border-edge rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand disabled:opacity-50"
        >
          <option value="client">Client</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
      </td>
    </tr>
  );
}
