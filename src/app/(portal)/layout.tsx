import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Badges";
import { Logo } from "@/components/Logo";
import type { Profile } from "@/lib/types";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
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

  const isStaff = profile?.role === "agent" || profile?.role === "admin";
  const roleLabel =
    profile?.role === "admin" ? "Admin" : profile?.role === "agent" ? "Support Agent" : "Client";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-panel/90 backdrop-blur border-b border-edge">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo subtitle="Client Portal" />

          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <Link href="/tickets" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-panel2">
              Tickets
            </Link>
            {isStaff && (
              <Link
                href="/analytics"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-panel2"
              >
                Analytics
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link
                href="/team"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-panel2"
              >
                Team
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full border border-edge text-slate-300">
              {roleLabel}
            </span>
            <Avatar name={profile?.full_name} size="h-8 w-8" color="bg-teal-500/20 text-teal-300" />
            <span className="text-sm text-white hidden sm:block">{profile?.full_name}</span>
            <form action="/auth/signout" method="post">
              <button className="text-xs text-slate-400 hover:text-white border border-edge rounded-lg px-3 py-1.5">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
