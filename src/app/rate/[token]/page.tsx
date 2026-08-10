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
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🙏</div>
              <h1 className="text-deep-navy font-bold text-lg">Thank you!</h1>
              <p className="text-sm text-slate-gray mt-1">
                Your feedback{picked ? ` (${picked}/5)` : ""} helps us improve.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-deep-navy font-bold text-lg">How did we do?</h1>
              <p className="text-sm text-slate-gray mt-1">
                Please rate the support you received. 1 = poor, 5 = excellent.
              </p>
              <div className="flex gap-2 mt-4 justify-between">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    disabled={pending}
                    onClick={() => submit(n)}
                    className={`h-12 flex-1 rounded-lg border text-lg font-semibold transition-colors ${
                      picked === n
                        ? "bg-deep-navy text-white border-deep-navy"
                        : "border-outline-variant text-slate-gray hover:border-vibrant-blue"
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
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm mt-4 text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue"
              />
              {error && <p className="text-sm text-[#ba1a1a] mt-2">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
