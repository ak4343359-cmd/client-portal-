import "server-only";

const FROM = process.env.EMAIL_FROM || "RDB IT Support <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Sends an email via Resend. No-ops (with a log) if RESEND_API_KEY isn't set. */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email skipped — RESEND_API_KEY not set] would send "${subject}" to ${to}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) console.error("[email] Resend error:", res.status, await res.text());
  } catch (e) {
    console.error("[email] failed to send:", e);
  }
}

/** Branded wrapper for notification emails. */
export function ticketEmail(opts: {
  reference: string;
  ticketId: number;
  subject: string;
  heading: string;
  body: string;
}) {
  const url = `${APP_URL}/tickets/${opts.ticketId}`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0b0f14;padding:24px;color:#e2e8f0">
    <div style="max-width:520px;margin:0 auto;background:#121822;border:1px solid #1e2733;border-radius:16px;overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #1e2733">
        <span style="font-weight:800;color:#fff">RDB IT Services</span>
        <span style="color:#94a3b8;font-size:13px"> · Support</span>
      </div>
      <div style="padding:24px">
        <div style="font-family:monospace;color:#94a3b8;font-size:12px">${opts.reference}</div>
        <h2 style="color:#fff;font-size:18px;margin:6px 0 2px">${opts.heading}</h2>
        <p style="color:#cbd5e1;font-size:14px;margin:2px 0 16px">${escapeHtml(opts.subject)}</p>
        <div style="color:#e2e8f0;font-size:14px;line-height:1.5">${opts.body}</div>
        <a href="${url}" style="display:inline-block;margin-top:20px;background:#2dd4bf;color:#0b0f14;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px">View ticket</a>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #1e2733;color:#64748b;font-size:12px">
        You're receiving this because you have an open ticket with RDB IT Services.
      </div>
    </div>
  </div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
