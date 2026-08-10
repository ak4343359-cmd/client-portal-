"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Profile, Role } from "@/lib/types";
import { Avatar } from "@/components/Badges";
import { addEmployee, setRole } from "@/app/(portal)/team/actions";

const ROLE_LABEL: Record<Role, string> = { client: "Client", agent: "Agent", admin: "Admin" };
const ROLE_CLS: Record<Role, string> = {
  admin: "text-[#b06000] border-[#fce8b2] bg-[#fef7e0]",
  agent: "text-vibrant-blue border-[#d2e3fc] bg-[#e8f0fe]",
  client: "text-slate-gray border-outline-variant bg-surface-container-high",
};

const inputCls =
  "w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue";

function AddBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-deep-navy hover:bg-vibrant-blue disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-deep-navy font-bold text-2xl">Team</h1>
          <p className="text-slate-gray text-sm mt-1">
            Invite employees and set who is an agent or admin. Clients never appear as assignees.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-deep-navy hover:bg-vibrant-blue text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors shadow-sm"
        >
          {showForm ? "Close" : "+ Add employee"}
        </button>
      </div>

      {!serviceKeySet && (
        <div className="text-sm text-[#7a4b00] bg-[#fff7e6] border border-[#fce8b2] rounded-xl p-3">
          ⚠ <strong>SUPABASE_SERVICE_ROLE_KEY</strong> is not set, so adding employees and changing roles
          won&apos;t work yet. Add it to your environment and restart.
        </div>
      )}

      {showForm && (
        <form action={formAction} className="bg-white border border-surface-variant rounded-xl p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1">Full name</label>
            <input name="full_name" placeholder="James Tran" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1">Email</label>
            <input name="email" type="email" required placeholder="james@rdbit.net" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1">Temporary password</label>
            <input name="password" required placeholder="At least 6 characters" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1">Role</label>
            <select name="role" defaultValue="agent" className={inputCls}>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <div className="text-sm">
              {state?.error && <span className="text-[#ba1a1a]">{state.error}</span>}
              {state?.message && <span className="text-[#137333]">{state.message}</span>}
            </div>
            <AddBtn />
          </div>
        </form>
      )}

      <div className="bg-white border border-surface-variant rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-gray border-b border-surface-variant bg-canvas">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold text-right">Set role</th>
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
    <tr className="border-b border-surface-variant last:border-0 hover:bg-surface-container-low transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={profile.full_name} />
          <span className="text-deep-navy font-medium">{profile.full_name ?? "—"}</span>
          {isSelf && <span className="text-[10px] text-slate-gray">(you)</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-gray hidden sm:table-cell">{profile.email}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_CLS[profile.role]}`}>
          {ROLE_LABEL[profile.role]}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <select
          defaultValue={profile.role}
          disabled={pending || disabled || isSelf}
          onChange={(e) => start(() => setRole(profile.id, e.target.value as Role))}
          title={isSelf ? "You can't change your own role" : undefined}
          className="bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue disabled:opacity-50"
        >
          <option value="client">Client</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
      </td>
    </tr>
  );
}
