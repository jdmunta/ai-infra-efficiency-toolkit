import { useEffect, useState } from "react";
import {
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { getCache } from "../api";
import { StatCard } from "../components/StatCard";

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

function RateGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const pct = Math.min(value * 100, 100);
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
          startAngle={90} endAngle={-270}
          data={[{ value: pct, fill: color }]}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#f3f4f6" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-2xl font-bold text-gray-900 -mt-16">{pct.toFixed(1)}%</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export function Cache() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getCache(7).then(setData);
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cache Analysis</h1>
        <p className="text-sm text-gray-500 mt-0.5">Duplicate and prefix overlap rates · 7-day window</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Duplicate Prompt Rate"
          value={`${(data.duplicate_prompt_rate * 100).toFixed(2)}%`}
          hint="Exact-match repeated prompts"
          accent={data.duplicate_prompt_rate > 0.1 ? "amber" : "default"}
        />
        <StatCard
          title="Prefix Overlap Rate"
          value={`${(data.prefix_overlap_rate * 100).toFixed(2)}%`}
          hint="Shared 200-char prefix"
          accent={data.prefix_overlap_rate > 0.1 ? "amber" : "default"}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-6">Cache Opportunity Gauges</h3>
        <div className="flex gap-12 justify-center flex-wrap">
          <RateGauge value={data.duplicate_prompt_rate} color="#6366f1" label="Duplicate Prompts" />
          <RateGauge value={data.prefix_overlap_rate} color="#10b981" label="Prefix Overlap" />
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          Higher values mean more potential cache savings. Identical requests are already deduplicated by the gateway's LRU cache.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Duplicate Prompts</h3>
        {data.top_duplicates.length === 0 ? (
          <p className="text-sm text-gray-400">No duplicates detected in the current window.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prompt Hash</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {data.top_duplicates.map((r: any, i: number) => (
                <tr key={r.prompt_hash} className={i % 2 === 0 ? "bg-gray-50/50" : ""}>
                  <td className="py-2.5 font-mono text-xs text-gray-600">{r.prompt_hash.slice(0, 24)}…</td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                      {r.count}×
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
