import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Ticket, Message, Csat } from "@/lib/types";
import { mergeDirectory } from "@/lib/directory";
import { ticketCode, timeAgo } from "@/lib/format";
import { StatusBadge, SlaBadge, Avatar } from "@/components/Badges";
import { StatusSelect, AssigneeSelect } from "@/components/TicketControls";
import MessageComposer from "@/components/MessageComposer";
import CsatWidget from "@/components/CsatWidget";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();
  const isStaff = profile?.role !== "client";

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single<Ticket>();
  if (!ticket) notFound();

  const [{ data: messages }, { data: profiles }, { data: staff }, { data: csat }] =
    await Promise.all([
      supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at"),
      supabase.from("profiles").select("id, full_name, email, role, company_id, phone"),
      supabase.from("staff_directory").select("id, full_name, role"),
      supabase.from("csat_ratings").select("*").eq("ticket_id", id).maybeSingle<Csat>(),
    ]);

  const directory = mergeDirectory(profiles as Profile[] | null, staff);
  const byId: Record<string, Profile> = {};
  directory.forEach((p) => (byId[p.id] = p));
  const agents = directory.filter((p) => p.role !== "client");
  const requester = byId[ticket.created_by];
  const showCsat = !isStaff && ticket.status === "closed" && csat;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/tickets" className="text-sm text-slate-400 hover:text-white">
        ← Back to tickets
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-mono">{ticket.reference ?? ticketCode(ticket.id)}</span>
            <StatusBadge status={ticket.status} />
            <SlaBadge ticket={ticket} />
          </div>
          <h1 className="text-white font-semibold text-xl mt-1.5 leading-snug">{ticket.subject}</h1>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate-500 mb-1">Status</label>
          {isStaff ? (
            <StatusSelect ticketId={ticket.id} value={ticket.status} />
          ) : (
            <div className="px-3 py-2 text-sm bg-panel border border-edge rounded-lg">
              {ticket.status}
            </div>
          )}
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate-500 mb-1">Assigned to</label>
          {isStaff ? (
            <AssigneeSelect ticketId={ticket.id} value={ticket.assigned_to} agents={agents} />
          ) : (
            <div className="px-3 py-2 text-sm bg-panel border border-edge rounded-lg flex items-center gap-2">
              {ticket.assigned_to ? (
                <>
                  <Avatar name={byId[ticket.assigned_to]?.full_name} />
                  {byId[ticket.assigned_to]?.full_name}
                </>
              ) : (
                <span className="text-amber-300">Awaiting assignment</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-4">
        <span>Category: <span className="text-slate-300">{ticket.category}</span></span>
        <span>Requester: <span className="text-slate-300">{requester?.full_name}</span></span>
        <span>Opened: <span className="text-slate-300">{new Date(ticket.created_at).toLocaleString()}</span></span>
        {ticket.sla_resolve_due && (
          <span>SLA due: <span className="text-slate-300">{new Date(ticket.sla_resolve_due).toLocaleString()}</span></span>
        )}
      </div>

      <div className="bg-panel border border-edge rounded-xl p-4 text-sm text-slate-300 mt-4">
        {ticket.description}
      </div>

      {showCsat && (
        <div className="mt-6">
          <CsatWidget token={csat!.token} submitted={!!csat!.submitted_at} score={csat!.score} />
        </div>
      )}

      {/* Conversation */}
      <h3 className="text-sm font-semibold text-white mt-8 mb-3">Conversation</h3>
      <div className="space-y-3">
        {(messages ?? []).map((m: Message) => {
          const author = m.author_id ? byId[m.author_id] : null;
          return (
            <div key={m.id} className="flex gap-3">
              <Avatar name={author?.full_name} size="h-8 w-8" color="bg-teal-500/20 text-teal-300" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{author?.full_name ?? "Unknown"}</span>
                  <span className="text-[10px] text-slate-500">{timeAgo(m.created_at)}</span>
                  {m.is_internal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Internal note
                    </span>
                  )}
                  {m.via_email && <span className="text-[10px] text-slate-500">via email</span>}
                </div>
                <div
                  className={`mt-1 text-sm rounded-lg px-3 py-2 whitespace-pre-wrap ${
                    m.is_internal
                      ? "bg-amber-500/5 border border-amber-500/20 text-amber-100"
                      : "bg-panel border border-edge text-slate-200"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        {(messages ?? []).length === 0 && (
          <p className="text-sm text-slate-500">No messages yet.</p>
        )}
      </div>

      <MessageComposer ticketId={ticket.id} isStaff={isStaff} />
    </div>
  );
}
