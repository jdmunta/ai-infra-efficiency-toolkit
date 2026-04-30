import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { getByTeam, getAlerts } from "../api";

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getByTeam(7), getAlerts(1)])
      .then(([t, a]) => { setTeams(t); setAlerts(a); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const triggered = alerts?.alerts || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Teams</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cost and usage breakdown by team · 7-day window</p>
      </div>

      {triggered.length > 0 && (
        <div className="space-y-2">
          {triggered.map((a: any) => (
            <div key={a.team}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                a.status === "over_budget"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <span className="font-semibold">{a.status === "over_budget" ? "🚨" : "⚠️"} {a.team}</span>
              <span>has used <strong>${a.spent_usd}</strong> of <strong>${a.budget_usd}</strong> daily budget ({a.pct_used}%)</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Cost by Team</h3>
        {teams.length === 0 ? (
          <p className="text-sm text-gray-400">No data. Add <code className="bg-gray-100 px-1 rounded">x-team: &lt;name&gt;</code> headers to your requests.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teams} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="team" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(4)}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(6)}`, "Cost"]} />
              <Bar dataKey="total_cost_usd" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Team Breakdown</h3>
        {teams.length === 0 ? (
          <p className="text-sm text-gray-400">No team data found in the current window.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Team", "Requests", "Cost", "Avg Latency"].map((h) => (
                  <th key={h} className={`pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === "Team" ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t: any, i: number) => (
                <tr key={t.team} className={i % 2 === 0 ? "bg-gray-50/50" : ""}>
                  <td className="py-2.5 font-medium text-gray-800">{t.team}</td>
                  <td className="py-2.5 text-right text-gray-600">{t.requests.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-semibold text-gray-800">${t.total_cost_usd.toFixed(6)}</td>
                  <td className="py-2.5 text-right text-gray-600">{t.avg_latency_ms.toFixed(0)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
