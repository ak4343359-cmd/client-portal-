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
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>();
  const isStaff = profile?.role !== "client";

  const { data: ticket } = await supabase.from("tickets").select("*").eq("id", id).single<Ticket>();
  if (!ticket) notFound();

  const [{ data: messages }, { data: profiles }, { data: staff }, { data: csat }] = await Promise.all([
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

  const card = "bg-white border border-surface-variant rounded-xl";

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <Link href="/tickets" className="text-sm text-slate-gray hover:text-vibrant-blue flex items-center gap-1 w-fit">
        <Icon name="arrow_back" className="text-[18px]" /> Back to tickets
      </Link>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-gray font-mono">{ticket.reference ?? ticketCode(ticket.id)}</span>
          <StatusBadge status={ticket.status} />
          <SlaBadge ticket={ticket} />
        </div>
        <h1 className="text-deep-navy font-bold text-2xl mt-2 leading-snug">{ticket.subject}</h1>
      </div>

      {/* Controls */}
      <div className={`${card} p-5 grid grid-cols-1 sm:grid-cols-2 gap-4`}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1.5">Status</label>
          {isStaff ? (
            <StatusSelect ticketId={ticket.id} value={ticket.status} />
          ) : (
            <div className="px-3 py-2 text-sm text-deep-navy">
              <StatusBadge status={ticket.status} />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-gray mb-1.5">Assigned to</label>
          {isStaff ? (
            <AssigneeSelect ticketId={ticket.id} value={ticket.assigned_to} agents={agents} />
          ) : (
            <div className="px-3 py-2 text-sm text-deep-navy flex items-center gap-2">
              {ticket.assigned_to ? (
                <>
                  <Avatar name={byId[ticket.assigned_to]?.full_name} />
                  {byId[ticket.assigned_to]?.full_name}
                </>
              ) : (
                <span className="text-[#b06000]">Awaiting assignment</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-gray flex flex-wrap gap-x-5 gap-y-1">
        <span>Category: <span className="text-deep-navy font-medium">{ticket.category}</span></span>
        <span>Requester: <span className="text-deep-navy font-medium">{requester?.full_name}</span></span>
        <span>Opened: <span className="text-deep-navy font-medium">{new Date(ticket.created_at).toLocaleString()}</span></span>
        {ticket.sla_resolve_due && (
          <span>SLA due: <span className="text-deep-navy font-medium">{new Date(ticket.sla_resolve_due).toLocaleString()}</span></span>
        )}
      </div>

      <div className={`${card} p-5 text-sm text-deep-navy whitespace-pre-wrap`}>{ticket.description}</div>

      {showCsat && <CsatWidget token={csat!.token} submitted={!!csat!.submitted_at} score={csat!.score} />}

      {/* Conversation */}
      <h3 className="text-sm font-bold text-deep-navy mt-2">Conversation</h3>
      <div className="flex flex-col gap-3">
        {(messages ?? []).map((m: Message) => {
          const author = m.author_id ? byId[m.author_id] : null;
          return (
            <div key={m.id} className="flex gap-3">
              <Avatar name={author?.full_name} size="h-9 w-9" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-deep-navy font-semibold">{author?.full_name ?? "Unknown"}</span>
                  <span className="text-xs text-slate-gray" suppressHydrationWarning>{timeAgo(m.created_at)}</span>
                  {m.is_internal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fef7e0] text-[#b06000] border border-[#fce8b2] font-medium">
                      Internal note
                    </span>
                  )}
                  {m.via_email && <span className="text-[10px] text-slate-gray">via email</span>}
                </div>
                <div
                  className={`mt-1 text-sm rounded-lg px-3 py-2 whitespace-pre-wrap ${
                    m.is_internal
                      ? "bg-[#fffaf0] border border-[#fce8b2] text-[#7a4b00]"
                      : "bg-white border border-surface-variant text-deep-navy"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        {(messages ?? []).length === 0 && <p className="text-sm text-slate-gray">No messages yet.</p>}
      </div>

      <MessageComposer ticketId={ticket.id} isStaff={isStaff} />
    </div>
  );
}
