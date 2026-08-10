"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  open: "#60a5fa",
  in_progress: "#fbbf24",
  on_hold: "#c084fc",
  resolved: "#34d399",
  closed: "#94a3b8",
};

const cardCls = "bg-panel border border-edge rounded-xl p-4";

export default function AnalyticsCharts({
  kpis,
  statusDist,
  agentLoad,
  weeks,
}: {
  kpis: { label: string; value: string }[];
  statusDist: { name: string; value: number }[];
  agentLoad: { name: string; active: number }[];
  weeks: { name: string; created: number; resolved: number }[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className={cardCls}>
            <div className="text-2xl font-bold text-brand">{k.value}</div>
            <div className="text-sm text-white mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardCls}>
          <div className="text-sm text-white font-medium mb-3">Status distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {statusDist.map((s) => (
                  <Cell key={s.name} fill={STATUS_COLORS[s.name]} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={cardCls}>
          <div className="text-sm text-white font-medium mb-3">Active load per agent</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={agentLoad}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="active" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={cardCls}>
        <div className="text-sm text-white font-medium mb-3">Throughput (last 6 weeks)</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weeks}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="created" stroke="#22d3ee" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="resolved" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "#0f141c",
  border: "1px solid #1e2733",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};
