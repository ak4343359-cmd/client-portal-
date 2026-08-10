"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, ticketEmail } from "@/lib/email";
import { STATUS } from "@/lib/constants";
import type { Profile, Status } from "@/lib/types";

async function me() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  return { supabase, user, profile };
}

/** Emails the client who raised a ticket. Safe no-op if email isn't configured. */
async function notifyClient(
  supabase: SupabaseClient,
  ticketId: number,
  heading: string,
  bodyHtml: string
) {
  const { data: t } = await supabase
    .from("tickets")
    .select("reference, subject, created_by")
    .eq("id", ticketId)
    .single<{ reference: string | null; subject: string; created_by: string }>();
  if (!t) return;
  const { data: client } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", t.created_by)
    .single<{ email: string | null }>();
  if (!client?.email) return;

  const reference = t.reference ?? `RDB-${ticketId}`;
  await sendEmail({
    to: client.email,
    subject: `[${reference}] ${heading}`,
    html: ticketEmail({ reference, ticketId, subject: t.subject, heading, body: bodyHtml }),
  });
}

export async function createTicket(_prev: unknown, formData: FormData) {
  const { supabase, user, profile } = await me();
  const isStaff = profile?.role !== "client";

  const subject = String(formData.get("subject") ?? "").trim();
  if (!subject) return { error: "Subject is required." };

  let createdBy = user.id;
  let companyId = profile?.company_id ?? null;
  if (isStaff) {
    const requester = String(formData.get("requester") ?? "");
    if (requester) {
      createdBy = requester;
      const { data: rp } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", requester)
        .single<{ company_id: string | null }>();
      companyId = rp?.company_id ?? null;
    }
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      subject,
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? "Other"),
      created_by: createdBy,
      company_id: companyId,
    })
    .select("id")
    .single<{ id: number }>();

  if (error) return { error: error.message };

  await notifyClient(
    supabase,
    data!.id,
    "We received your ticket",
    "Thanks for reaching out. Your ticket has been logged and our team will be on it shortly. We'll email you as it progresses."
  );

  revalidatePath("/tickets");
  redirect(`/tickets/${data!.id}`);
}

export async function postMessage(formData: FormData) {
  const { supabase, user, profile } = await me();
  const ticketId = Number(formData.get("ticket_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const isStaff = profile?.role !== "client";
  const isInternal = isStaff && formData.get("internal") === "on";

  await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    author_id: user.id,
    body,
    is_internal: isInternal,
  });

  // Notify the client only when staff replies publicly (not on internal notes or the client's own posts).
  if (isStaff && !isInternal) {
    await notifyClient(
      supabase,
      ticketId,
      "New reply from RDB IT support",
      `<p style="margin:0 0 8px;color:#94a3b8">${profile?.full_name ?? "Support"} replied:</p>
       <div style="background:#0f141c;border:1px solid #1e2733;border-radius:10px;padding:12px;white-space:pre-wrap">${escapeHtml(body)}</div>`
    );
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function changeStatus(ticketId: number, status: Status) {
  const { supabase } = await me();
  const { error } = await supabase.from("tickets").update({ status }).eq("id", ticketId);
  if (error) throw new Error(`Could not update status: ${error.message}`);

  await notifyClient(
    supabase,
    ticketId,
    `Status updated to "${STATUS[status].label}"`,
    `<p style="margin:0">Your ticket status is now <strong style="color:#fff">${STATUS[status].label}</strong>.</p>`
  );

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function changeAssignee(ticketId: number, assignee: string | null) {
  const { supabase } = await me();
  const { error } = await supabase.from("tickets").update({ assigned_to: assignee }).eq("id", ticketId);
  if (error) throw new Error(`Could not update assignee: ${error.message}`);

  let who = "our support team";
  if (assignee) {
    const { data: a } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", assignee)
      .single<{ full_name: string | null }>();
    who = a?.full_name ?? who;
  }
  await notifyClient(
    supabase,
    ticketId,
    "Your ticket has been assigned",
    `<p style="margin:0">Your ticket is now being handled by <strong style="color:#fff">${escapeHtml(who)}</strong>.</p>`
  );

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
