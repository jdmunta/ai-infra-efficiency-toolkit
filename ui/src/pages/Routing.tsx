import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { getRouting } from "../api";
import { StatCard } from "../components/StatCard";

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export function Routing() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getRouting(7).then(setData).catch((e: any) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-500 text-sm">{err}</p>;
  if (!data) return <Spinner />;

  const totals = data.totals_usd || {};
  const savings = data.savings_vs_current || {};

  const policyChartData = [
    { policy: "Current", cost: totals.current || 0 },
    { policy: "All Mini", cost: totals.all_mini || 0 },
    { policy: "Heuristic", cost: totals.heuristic || 0 },
  ];

  const mix: Record<string, Record<string, number>> = data.model_mix || {};
  const allModels = Array.from(new Set(
    Object.values(mix).flatMap((m) => Object.keys(m))
  ));
  const mixChartData = Object.entries(mix).map(([policy, counts]) => ({
    policy,
    ...counts,
  }));

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Routing Simulation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Counterfactual cost under three routing policies · 7-day window</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Requests Considered" value={data.requests_considered.toLocaleString()} hint="With token counts" />
        <StatCard title="Current Cost" value={`$${Number(totals.current || 0).toFixed(5)}`} />
        <StatCard title="All-Mini Cost" value={`$${Number(totals.all_mini || 0).toFixed(5)}`}
          hint={`Save ${savings.all_mini?.pct?.toFixed(1) || 0}%`} accent="green" />
        <StatCard title="Heuristic Cost" value={`$${Number(totals.heuristic || 0).toFixed(5)}`}
          hint={`Save ${savings.heuristic?.pct?.toFixed(1) || 0}%`} accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cost by Policy</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={policyChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="policy" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(4)}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(6)}`, "Cost"]} />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}
                fill="#6366f1"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Model Mix by Policy</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mixChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="policy" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              {allModels.map((m, i) => (
                <Bar key={m} dataKey={m} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === allModels.length - 1 ? [4, 4, 0, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Savings vs Current</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Policy</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">USD Saved</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">% Saved</th>
            </tr>
          </thead>
          <tbody>
            {[["All Mini", "all_mini"], ["Heuristic", "heuristic"]].map(([label, key]) => (
              <tr key={key} className="border-b border-gray-50">
                <td className="py-3 font-medium text-gray-700">{label}</td>
                <td className="py-3 text-right text-emerald-600 font-semibold">
                  ${Number(savings[key]?.usd || 0).toFixed(6)}
                </td>
                <td className="py-3 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    {Number(savings[key]?.pct || 0).toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-4">
          Simulation uses stored features (is_codey, prompt_len_bucket). Only requests with non-zero token counts are included.
        </p>
      </div>
    </div>
  );
}
