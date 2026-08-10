// Supabase Edge Function: send-notification
// Triggered by a Database Webhook on INSERT into ticket_messages (and status changes).
// Sends a transactional email via Resend and writes an in-app notification row.
//
// Deploy:  supabase functions deploy send-notification --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=... INBOUND_EMAIL_HMAC_SECRET=... APP_URL=https://portal.rdbit.net
//
// Configure the webhook in Supabase → Database → Webhooks:
//   table: ticket_messages, events: INSERT  ->  POST this function's URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const HMAC_SECRET = Deno.env.get("INBOUND_EMAIL_HMAC_SECRET")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://portal.rdbit.net";
const FROM = "RDB IT Support <support@rdbit.net>";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function hmac(input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

Deno.serve(async (req) => {
  const payload = await req.json();
  const msg = payload.record; // the inserted ticket_messages row
  if (!msg || msg.is_internal) return new Response("skip", { status: 200 });

  // Load ticket + participants
  const { data: ticket } = await admin.from("tickets").select("*").eq("id", msg.ticket_id).single();
  if (!ticket) return new Response("no ticket", { status: 200 });

  const { data: author } = await admin.from("profiles").select("*").eq("id", msg.author_id).single();

  // Recipient = the "other side" of the conversation.
  const isFromClient = author?.role === "client";
  let recipientId = isFromClient ? ticket.assigned_to : ticket.created_by;
  if (!recipientId) return new Response("no recipient", { status: 200 });

  const { data: recipient } = await admin.from("profiles").select("*").eq("id", recipientId).single();
  if (!recipient?.email) return new Response("no email", { status: 200 });

  // Reply-by-email address: support+<ticketId>-<hmac>@rdbit.net
  const sig = await hmac(`${ticket.id}`);
  const replyTo = `support+${ticket.id}-${sig}@rdbit.net`;

  const subject = `[RDB-${ticket.id}] ${ticket.subject}`;
  const body = `
    <p><strong>${author?.full_name ?? "RDB IT"}</strong> wrote:</p>
    <blockquote style="border-left:3px solid #2dd4bf;padding-left:12px;color:#334">${msg.body}</blockquote>
    <p><a href="${APP_URL}/tickets/${ticket.id}">View ticket RDB-${ticket.id}</a> — or just reply to this email.</p>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: recipient.email, reply_to: replyTo, subject, html: body }),
  });

  await admin.from("notifications").insert({
    user_id: recipient.id,
    ticket_id: ticket.id,
    message: `New reply on RDB-${ticket.id}`,
  });

  return new Response("sent", { status: 200 });
});
