import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Ticket, Csat } from "@/lib/types";
import { hoursBetween } from "@/lib/format";
import AnalyticsCharts from "@/components/AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();
  if (profile?.role === "client") redirect("/tickets");

  const [{ data: tickets }, { data: profiles }, { data: csat }] = await Promise.all([
    supabase.from("tickets").select("*"),
    supabase.from("profiles").select("id, full_name, role"),
    supabase.from("csat_ratings").select("*"),
  ]);

  const t = (tickets ?? []) as Ticket[];
  const nameById: Record<string, string> = {};
  (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => {
    nameById[p.id] = p.full_name ?? "—";
  });

  // KPIs
  const responses = t.map((x) => hoursBetween(x.created_at, x.first_response_at)).filter((n): n is number => n != null);
  const resolutions = t.map((x) => hoursBetween(x.created_at, x.resolved_at)).filter((n): n is number => n != null);
  const avg = (a: number[]) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0);

  const resolvedOrClosed = t.filter((x) => x.resolved_at);
  const slaMet = resolvedOrClosed.filter(
    (x) => x.sla_resolve_due && new Date(x.resolved_at!) <= new Date(x.sla_resolve_due)
  ).length;
  const slaCompliance = resolvedOrClosed.length
    ? Math.round((slaMet / resolvedOrClosed.length) * 100)
    : 100;

  const ratings = ((csat ?? []) as Csat[]).filter((c) => c.score != null);
  const csatAvg = ratings.length ? avg(ratings.map((r) => r.score!)) : null;

  // Status distribution
  const statusDist = ["open", "in_progress", "on_hold", "resolved", "closed"].map((s) => ({
    name: s,
    value: t.filter((x) => x.status === s).length,
  }));

  // Per-agent active load
  const agentLoad = (profiles ?? [])
    .filter((p: { role: string }) => p.role !== "client")
    .map((p: { id: string; full_name: string | null }) => ({
      name: p.full_name ?? "—",
      active: t.filter((x) => x.assigned_to === p.id && ["open", "in_progress", "on_hold"].includes(x.status)).length,
    }));

  // Weekly throughput (last 6 weeks): created vs resolved
  const weeks: { name: string; created: number; resolved: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    weeks.push({
      name: `${start.getMonth() + 1}/${start.getDate()}`,
      created: t.filter((x) => new Date(x.created_at) >= start && new Date(x.created_at) < end).length,
      resolved: t.filter((x) => x.resolved_at && new Date(x.resolved_at) >= start && new Date(x.resolved_at) < end).length,
    });
  }

  const kpis = [
    { label: "Avg first response", value: responses.length ? `${avg(responses).toFixed(1)}h` : "—" },
    { label: "Avg resolution", value: resolutions.length ? `${avg(resolutions).toFixed(1)}h` : "—" },
    { label: "SLA compliance", value: `${slaCompliance}%` },
    { label: "CSAT", value: csatAvg != null ? `${csatAvg.toFixed(1)}/5` : "—" },
    { label: "Total tickets", value: String(t.length) },
  ];

  return (
    <div>
      <h1 className="text-deep-navy font-bold text-2xl mb-1">Analytics</h1>
      <p className="text-sm text-slate-gray mb-6">Support performance across all tickets.</p>
      <AnalyticsCharts
        kpis={kpis}
        statusDist={statusDist}
        agentLoad={agentLoad}
        weeks={weeks}
      />
    </div>
  );
}
