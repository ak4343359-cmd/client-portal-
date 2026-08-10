import { createClient } from "@/lib/supabase/server";
import type { Profile, Ticket } from "@/lib/types";
import { mergeDirectory } from "@/lib/directory";
import TicketsView from "@/components/TicketsView";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
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

  const [{ data: tickets }, { data: profiles }, { data: staff }, { data: msgCounts }] =
    await Promise.all([
      supabase.from("tickets").select("*").order("updated_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email, role, company_id, phone"),
      supabase.from("staff_directory").select("id, full_name, role"),
      supabase.from("ticket_messages").select("ticket_id"),
    ]);

  const counts: Record<number, number> = {};
  (msgCounts ?? []).forEach((m: { ticket_id: number }) => {
    counts[m.ticket_id] = (counts[m.ticket_id] ?? 0) + 1;
  });

  return (
    <TicketsView
      isStaff={isStaff}
      tickets={(tickets ?? []) as Ticket[]}
      profiles={mergeDirectory(profiles as Profile[] | null, staff)}
      messageCounts={counts}
    />
  );
}
