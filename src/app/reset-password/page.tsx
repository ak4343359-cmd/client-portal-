"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Supabase puts a recovery session in the URL; wait until it's picked up.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => router.push("/tickets"), 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-md fade">
        <div className="flex items-center justify-center mb-6">
          <div className="h-12 rounded-xl bg-white border border-surface-variant px-3 flex items-center shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="RDB IT Services" className="h-8 w-auto" />
          </div>
        </div>

        <div className="bg-white border border-surface-variant rounded-xl p-6 shadow-sm">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">✅</div>
              <h1 className="text-deep-navy font-bold text-lg">Password updated</h1>
              <p className="text-sm text-slate-gray mt-1">Taking you to your dashboard…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <h1 className="text-deep-navy font-bold text-lg">Reset link</h1>
              <p className="text-sm text-slate-gray mt-2">
                Open this page from the reset link in your email. If you got here directly, request a
                new link from the sign-in screen.
              </p>
              <a href="/login" className="inline-block mt-4 text-vibrant-blue font-semibold hover:underline text-sm">
                Back to sign in
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h1 className="text-deep-navy font-bold text-xl">Set a new password</h1>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1.5">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue"
                />
              </div>
              {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-deep-navy hover:bg-vibrant-blue disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
              >
                {saving ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
