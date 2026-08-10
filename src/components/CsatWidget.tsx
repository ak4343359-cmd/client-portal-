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
      <div className="bg-[#e6f4ea] border border-[#ceead6] rounded-xl p-4 text-sm text-[#137333]">
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
    <div className="bg-white border border-surface-variant rounded-xl p-4">
      <div className="text-sm text-deep-navy font-semibold">How did we do?</div>
      <p className="text-xs text-slate-gray mt-0.5">Rate the support you received on this ticket.</p>
      <div className="flex gap-2 mt-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            disabled={pending}
            onClick={() => submit(n)}
            className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors ${
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
        rows={2}
        placeholder="Optional comment…"
        className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm mt-3 text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue"
      />
    </div>
  );
}
