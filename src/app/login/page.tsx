"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signInClient, signUpClient, signInEmployee } from "./actions";
import { Logo } from "@/components/Logo";

type Result = { error?: string; message?: string } | null;

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand hover:bg-teal-300 disabled:opacity-60 text-ink font-semibold rounded-lg py-2.5 text-sm transition"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
      />
    </div>
  );
}

function Msg({ state }: { state: Result }) {
  if (!state) return null;
  if (state.error) return <p className="text-sm text-red-400">{state.error}</p>;
  if (state.message) return <p className="text-sm text-emerald-300">{state.message}</p>;
  return null;
}

export default function LoginPage() {
  const [tab, setTab] = useState<"client" | "employee">("client");
  const [clientMode, setClientMode] = useState<"signin" | "signup">("signin");

  const [signInState, signInAction] = useFormState(signInClient, null as Result);
  const [signUpState, signUpAction] = useFormState(signUpClient, null as Result);
  const [empState, empAction] = useFormState(signInEmployee, null as Result);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md fade">
        <div className="flex mb-8 justify-center">
          <Logo subtitle="Client Support Portal" size="lg" />
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-panel2 border border-edge rounded-xl mb-4">
          {(["client", "employee"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 text-sm font-medium rounded-lg transition ${
                tab === t ? "bg-brand text-ink" : "text-slate-300 hover:text-white"
              }`}
            >
              {t === "client" ? "Client" : "Employee"}
            </button>
          ))}
        </div>

        <div className="bg-panel border border-edge rounded-2xl p-6 shadow-2xl">
          {tab === "client" ? (
            clientMode === "signin" ? (
              <form action={signInAction} className="space-y-3">
                <h1 className="text-white font-semibold text-lg">Client sign in</h1>
                <Field label="Email" name="email" type="email" placeholder="you@company.com" />
                <Field label="Password" name="password" type="password" placeholder="••••••••" />
                <Msg state={signInState} />
                <SubmitBtn label="Sign in" />
                <p className="text-sm text-slate-400 pt-1">
                  New here?{" "}
                  <button type="button" onClick={() => setClientMode("signup")} className="text-brand hover:underline">
                    Create an account
                  </button>
                </p>
              </form>
            ) : (
              <form action={signUpAction} className="space-y-3">
                <h1 className="text-white font-semibold text-lg">Create your account</h1>
                <Field label="Full name" name="full_name" placeholder="Jane Smith" />
                <Field label="Email" name="email" type="email" placeholder="you@company.com" />
                <Field label="Password" name="password" type="password" placeholder="At least 6 characters" />
                <Msg state={signUpState} />
                <SubmitBtn label="Create account" />
                <p className="text-sm text-slate-400 pt-1">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setClientMode("signin")} className="text-brand hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )
          ) : (
            <form action={empAction} className="space-y-3">
              <h1 className="text-white font-semibold text-lg">Employee sign in</h1>
              <p className="text-xs text-slate-500">
                Staff access only. Accounts are provisioned by RDB IT — there is no public sign-up.
              </p>
              <Field label="Email" name="email" type="email" placeholder="you@rdbit.net" />
              <Field label="Password" name="password" type="password" placeholder="••••••••" />
              <Msg state={empState} />
              <SubmitBtn label="Sign in" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
