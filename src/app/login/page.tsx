"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signInClient, signUpClient, signInEmployee } from "./actions";
import { createClient } from "@/lib/supabase/client";

type Result = { error?: string; message?: string } | null;

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-deep-navy hover:bg-vibrant-blue disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-sm"
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
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue transition-colors"
      />
    </div>
  );
}

function Msg({ state }: { state: Result }) {
  if (!state) return null;
  if (state.error) return <p className="text-sm text-[#ba1a1a]">{state.error}</p>;
  if (state.message) return <p className="text-sm text-[#137333]">{state.message}</p>;
  return null;
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<Result>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState(null);
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) setState({ error: error.message });
    else setState({ message: "If that email has an account, a reset link is on its way. Check your inbox." });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-deep-navy font-bold text-xl">Reset your password</h1>
      <p className="text-sm text-slate-gray">Enter your email and we&apos;ll send you a reset link.</p>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1.5">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue"
        />
      </div>
      <Msg state={state} />
      <button
        type="submit"
        disabled={sending}
        className="w-full bg-deep-navy hover:bg-vibrant-blue disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
      >
        {sending ? "Sending…" : "Send reset link"}
      </button>
      <button type="button" onClick={onBack} className="text-vibrant-blue font-semibold hover:underline text-sm">
        ← Back to sign in
      </button>
    </form>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState<"client" | "employee">("client");
  const [clientMode, setClientMode] = useState<"signin" | "signup" | "forgot">("signin");

  const [signInState, signInAction] = useFormState(signInClient, null as Result);
  const [signUpState, signUpAction] = useFormState(signUpClient, null as Result);
  const [empState, empAction] = useFormState(signInEmployee, null as Result);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-md fade">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-12 rounded-xl bg-white border border-surface-variant px-3 flex items-center shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="RDB IT Services" className="h-8 w-auto" />
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container-low border border-surface-variant rounded-xl mb-4">
          {(["client", "employee"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 text-sm font-semibold rounded-lg transition ${
                tab === t ? "bg-deep-navy text-white shadow-sm" : "text-slate-gray hover:text-deep-navy"
              }`}
            >
              {t === "client" ? "Client" : "Employee"}
            </button>
          ))}
        </div>

        <div className="bg-white border border-surface-variant rounded-xl p-6 shadow-sm">
          {tab === "client" ? (
            clientMode === "forgot" ? (
              <ForgotForm onBack={() => setClientMode("signin")} />
            ) : clientMode === "signin" ? (
              <form action={signInAction} className="space-y-4">
                <h1 className="text-deep-navy font-bold text-xl">Client sign in</h1>
                <Field label="Email" name="email" type="email" placeholder="you@company.com" />
                <Field label="Password" name="password" type="password" placeholder="••••••••" />
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => setClientMode("forgot")}
                    className="text-sm text-vibrant-blue font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Msg state={signInState} />
                <SubmitBtn label="Sign in" />
                <p className="text-sm text-slate-gray">
                  New here?{" "}
                  <button type="button" onClick={() => setClientMode("signup")} className="text-vibrant-blue font-semibold hover:underline">
                    Create an account
                  </button>
                </p>
              </form>
            ) : (
              <form action={signUpAction} className="space-y-4">
                <h1 className="text-deep-navy font-bold text-xl">Create your account</h1>
                <Field label="Full name" name="full_name" placeholder="Jane Smith" />
                <Field label="Email" name="email" type="email" placeholder="you@company.com" />
                <Field label="Password" name="password" type="password" placeholder="At least 6 characters" />
                <Msg state={signUpState} />
                <SubmitBtn label="Create account" />
                <p className="text-sm text-slate-gray">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setClientMode("signin")} className="text-vibrant-blue font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )
          ) : (
            <form action={empAction} className="space-y-4">
              <h1 className="text-deep-navy font-bold text-xl">Employee sign in</h1>
              <p className="text-xs text-slate-gray">
                Staff access only. Accounts are provisioned by RDB IT — there is no public sign-up.
              </p>
              <Field label="Email" name="email" type="email" placeholder="you@rdbit.net" />
              <Field label="Password" name="password" type="password" placeholder="••••••••" />
              <Msg state={empState} />
              <SubmitBtn label="Sign in" />
            </form>
          )}
        </div>
        <p className="text-center text-xs text-slate-gray mt-4">
          © 2024 RDB IT Services. Secure client portal.
        </p>
      </div>
    </div>
  );
}
