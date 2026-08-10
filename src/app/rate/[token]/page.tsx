"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RatePage({ params }: { params: { token: string } }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  function submit(value: number) {
    setPicked(value);
    setError(null);
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("submit_csat", {
        p_token: params.token,
        p_score: value,
        p_comment: comment,
      });
      if (error) setError("This rating link is invalid or has already been used.");
      else setDone(true);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md fade">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand to-brand2 grid place-items-center text-ink font-extrabold">
            R
          </div>
          <div className="font-extrabold text-white text-lg">RDB IT Services</div>
        </div>

        <div className="bg-panel border border-edge rounded-2xl p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🙏</div>
              <h1 className="text-white font-semibold text-lg">Thank you!</h1>
              <p className="text-sm text-slate-400 mt-1">
                Your feedback{picked ? ` (${picked}/5)` : ""} helps us improve.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-white font-semibold text-lg">How did we do?</h1>
              <p className="text-sm text-slate-400 mt-1">
                Please rate the support you received. 1 = poor, 5 = excellent.
              </p>
              <div className="flex gap-2 mt-4 justify-between">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    disabled={pending}
                    onClick={() => submit(n)}
                    className={`h-12 flex-1 rounded-lg border text-lg font-semibold transition ${
                      picked === n
                        ? "bg-brand text-ink border-brand"
                        : "border-edge text-slate-300 hover:border-brand"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Anything else you'd like us to know? (optional)"
                className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm mt-4 focus:outline-none focus:border-brand"
              />
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
