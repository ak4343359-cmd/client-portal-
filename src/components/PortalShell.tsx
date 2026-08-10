"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { Profile } from "@/lib/types";

export default function PortalShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isStaff = profile?.role === "agent" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin";
  const roleLabel = isAdmin ? "Admin" : profile?.role === "agent" ? "Support Agent" : "Client";

  const nav = [
    { href: "/tickets", label: "Support Tickets", icon: "confirmation_number", show: true },
    { href: "/analytics", label: "Analytics", icon: "insights", show: isStaff },
    { href: "/team", label: "Team", icon: "group", show: isAdmin },
  ].filter((n) => n.show);

  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarInner = (
    <>
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="h-11 rounded-xl bg-white px-2 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="RDB IT Services" className="h-8 w-auto" />
        </div>
        <div className="leading-tight">
          <h1 className="text-on-primary font-bold text-base">RDB IT Services</h1>
          <p className="text-on-primary-container text-xs mt-0.5">Enterprise IT Services</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 flex-grow">
        {nav.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-secondary text-on-secondary"
                  : "text-on-primary-container hover:bg-on-primary-fixed-variant hover:text-white"
              }`}
            >
              <Icon name={n.icon} className="text-[20px]" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <form action="/auth/signout" method="post" className="mt-4">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-on-primary-container hover:bg-on-primary-fixed-variant hover:text-white transition-colors">
          <Icon name="logout" className="text-[20px]" />
          Sign out
        </button>
      </form>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="bg-primary-container fixed h-full left-0 w-64 flex-col py-8 px-4 z-20 hidden md:flex">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-primary-container flex flex-col py-8 px-4 fade">
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="flex-grow flex flex-col md:ml-64 w-full min-w-0">
        {/* Top bar */}
        <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10 flex justify-between items-center w-full px-4 md:px-8 h-16">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-gray" onClick={() => setOpen(true)}>
              <Icon name="menu" />
            </button>
            <span className="font-bold text-lg text-deep-navy hidden sm:block">Client Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-xs font-medium px-3 py-1 rounded-full bg-surface-container-high text-slate-gray">
              {roleLabel}
            </span>
            <div className="h-9 w-9 rounded-full bg-deep-navy text-white grid place-items-center text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium text-deep-navy hidden sm:block">
              {profile?.full_name}
            </span>
          </div>
        </header>

        <main className="flex-grow p-4 md:p-8 bg-canvas">
          <div className="max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
