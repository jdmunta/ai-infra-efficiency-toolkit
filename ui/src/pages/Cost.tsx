import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { getSummary, getTimeseries } from "../api";
import { StatCard } from "../components/StatCard";

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function Cost() {
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => {
    getSummary(7).then(setSummary);
    getTimeseries(14).then(setSeries);
  }, []);

  if (!summary) return <Spinner />;

  const errorPct = (summary.error_rate * 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cost Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Last 7 days · refreshed on load</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={summary.total_requests.toLocaleString()} hint="7-day window" />
        <StatCard title="Estimated Cost" value={`$${summary.total_cost_usd.toFixed(4)}`} hint="from usage fields" accent="green" />
        <StatCard title="Avg Latency" value={`${summary.avg_latency_ms.toFixed(0)} ms`} />
        <StatCard
          title="Error Rate"
          value={`${errorPct}%`}
          accent={summary.error_rate > 0.05 ? "red" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Cost (14d)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="ts" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(5)}`, "Cost"]} />
              <Line type="monotone" dataKey="cost_usd" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} name="Cost ($)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Requests (14d)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="ts" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="requests" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="P95 Latency Trend (14d)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="ts" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(0)} ms`, "P95"]} />
            <Line type="monotone" dataKey="p95_latency_ms" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} name="P95 (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
