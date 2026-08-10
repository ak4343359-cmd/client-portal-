import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import TeamManager from "@/components/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (me?.role !== "admin") redirect("/tickets");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_id, phone")
    .order("role");

  const serviceKeySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <TeamManager
      profiles={(profiles ?? []) as Profile[]}
      currentUserId={user!.id}
      serviceKeySet={serviceKeySet}
    />
  );
}
