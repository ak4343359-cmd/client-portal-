"use client";

import { useRef, useState, useTransition } from "react";
import { postMessage } from "@/app/(portal)/tickets/actions";

export default function MessageComposer({
  ticketId,
  isStaff,
}: {
  ticketId: number;
  isStaff: boolean;
}) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          await postMessage(fd);
          setBody("");
          formRef.current?.reset();
        })
      }
      className="mt-4"
    >
      <input type="hidden" name="ticket_id" value={ticketId} />
      <textarea
        name="body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply…"
        className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-sm text-deep-navy focus:outline-none focus:border-vibrant-blue focus:ring-1 focus:ring-vibrant-blue"
      />
      <div className="flex items-center justify-between mt-2">
        {isStaff ? (
          <label className="flex items-center gap-2 text-xs text-slate-gray">
            <input type="checkbox" name="internal" className="accent-vibrant-blue" />
            Internal note (hidden from client)
          </label>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="bg-deep-navy hover:bg-vibrant-blue disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-1.5 text-sm transition-colors"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
