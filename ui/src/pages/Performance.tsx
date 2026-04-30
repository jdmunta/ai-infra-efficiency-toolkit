import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
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

export function Performance() {
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => {
    getSummary(7).then(setSummary);
    getTimeseries(14).then(setSeries);
  }, []);

  if (!summary) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Performance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Latency and error trends · 7-day / 14-day windows</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Avg Latency" value={`${summary.avg_latency_ms.toFixed(0)} ms`} hint="7-day average" />
        <StatCard title="Error Rate" value={`${(summary.error_rate * 100).toFixed(2)}%`}
          accent={summary.error_rate > 0.05 ? "red" : "default"} hint="4xx + 5xx over total" />
        <StatCard title="Total Requests" value={summary.total_requests.toLocaleString()} hint="7-day window" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">P95 Latency (14d)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="ts" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(0)} ms`, "P95"]} />
            <Area type="monotone" dataKey="p95_latency_ms" stroke="#f59e0b" strokeWidth={2}
              fill="url(#latGrad)" dot={{ r: 3, fill: "#f59e0b" }} name="P95 (ms)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Request Volume (14d)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="ts" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2}
              fill="url(#reqGrad)" dot={{ r: 3, fill: "#6366f1" }} name="Requests" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
