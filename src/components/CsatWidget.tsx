"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CsatWidget({
  token,
  submitted,
  score,
}: {
  token: string;
  submitted: boolean;
  score: number | null;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(submitted);
  const [picked, setPicked] = useState<number | null>(score);
  const [comment, setComment] = useState("");

  if (done) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-200">
        Thanks for your feedback{picked ? ` — you rated ${picked}/5` : ""}.
      </div>
    );
  }

  function submit(value: number) {
    setPicked(value);
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("submit_csat", {
        p_token: token,
        p_score: value,
        p_comment: comment,
      });
      if (!error) setDone(true);
    });
  }

  return (
    <div className="bg-panel border border-edge rounded-xl p-4">
      <div className="text-sm text-white font-medium">How did we do?</div>
      <p className="text-xs text-slate-400 mt-0.5">Rate the support you received on this ticket.</p>
      <div className="flex gap-2 mt-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            disabled={pending}
            onClick={() => submit(n)}
            className={`h-9 w-9 rounded-lg border text-sm font-semibold transition ${
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
        rows={2}
        placeholder="Optional comment…"
        className="w-full bg-panel2 border border-edge rounded-lg px-3 py-2 text-sm mt-3 focus:outline-none focus:border-brand"
      />
    </div>
  );
}
