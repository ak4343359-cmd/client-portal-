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
  open: "#1a73e8",
  in_progress: "#b06000",
  on_hold: "#7e22ce",
  resolved: "#137333",
  closed: "#4A5568",
};

const cardCls = "bg-white border border-surface-variant rounded-xl p-4";

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
            <div className="text-2xl font-bold text-vibrant-blue">{k.value}</div>
            <div className="text-sm text-deep-navy font-medium mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardCls}>
          <div className="text-sm text-deep-navy font-semibold mb-3">Status distribution</div>
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
          <div className="text-sm text-deep-navy font-semibold mb-3">Active load per agent</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={agentLoad}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" />
              <XAxis dataKey="name" tick={{ fill: "#4A5568", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#4A5568", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#0000000a" }} />
              <Bar dataKey="active" fill="#005EB8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={cardCls}>
        <div className="text-sm text-deep-navy font-semibold mb-3">Throughput (last 6 weeks)</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weeks}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" />
            <XAxis dataKey="name" tick={{ fill: "#4A5568", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#4A5568", fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="created" stroke="#005EB8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="resolved" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e2e2",
  borderRadius: 8,
  fontSize: 12,
  color: "#002147",
};
