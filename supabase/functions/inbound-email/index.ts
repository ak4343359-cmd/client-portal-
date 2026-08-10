// Supabase Edge Function: inbound-email  (reply-by-email)
// Receives parsed inbound emails from your inbound provider (Postmark Inbound,
// Mailgun Routes, or Cloudflare Email Workers) and appends them to the ticket.
//
// Deploy:  supabase functions deploy inbound-email --no-verify-jwt
// Point your inbound provider's webhook for support+*@rdbit.net at this URL.
//
// Expected JSON (normalize your provider's payload to this shape upstream if needed):
//   { "to": "support+42-ab12cd34@rdbit.net", "from": "maria@northsidedental.com",
//     "text": "reply body with quoted history", "html": "..." }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HMAC_SECRET = Deno.env.get("INBOUND_EMAIL_HMAC_SECRET")!;
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

// Strip quoted history / signatures — keep only the new reply text.
function stripQuoted(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (/^>/.test(line)) break;
    if (/^On .* wrote:$/.test(line)) break;
    if (/^-{2,}\s*$/.test(line)) break; // signature delimiter
    if (/^From: /.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

Deno.serve(async (req) => {
  const mail = await req.json();
  const to: string = mail.to ?? "";
  const match = to.match(/support\+(\d+)-([a-f0-9]+)@/i);
  if (!match) return new Response("bad address", { status: 400 });

  const ticketId = Number(match[1]);
  const sig = match[2];
  if ((await hmac(`${ticketId}`)) !== sig) return new Response("bad signature", { status: 403 });

  // Match sender email → profile (author). Unknown senders are dropped.
  const fromEmail = (mail.from ?? "").match(/[^<\s]+@[^>\s]+/)?.[0]?.toLowerCase();
  const { data: author } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", fromEmail ?? "___none___")
    .maybeSingle();
  if (!author) return new Response("unknown sender", { status: 202 });

  const body = stripQuoted(mail.text ?? "");
  if (!body) return new Response("empty", { status: 200 });

  await admin.from("ticket_messages").insert({
    ticket_id: ticketId,
    author_id: author.id,
    body,
    via_email: true,
  });

  return new Response("ok", { status: 200 });
});
