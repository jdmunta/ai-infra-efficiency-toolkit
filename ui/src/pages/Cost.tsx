import { useEffect, useState } from "react";
import { getSummary, getTimeseries } from "../api";
import { StatCard } from "../components/StatCard";

export function Cost() {
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setSummary(await getSummary(7));
      setSeries(await getTimeseries(14));
    })();
  }, []);

  if (!summary) return <div>Loading…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard title="Total Requests (7d)" value={`${summary.total_requests}`} />
        <StatCard title="Estimated Cost (7d)" value={`$${summary.total_cost_usd.toFixed(2)}`} />
        <StatCard title="Avg Latency (ms)" value={`${summary.avg_latency_ms.toFixed(0)}`} />
        <StatCard title="Error Rate" value={`${(summary.error_rate * 100).toFixed(2)}%`} />
      </div>

      <h3 style={{ marginTop: 22 }}>Daily Trend (14d)</h3>
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th>Date</th><th>Requests</th><th>Cost</th><th>Max Latency (MVP)</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.ts}>
                <td>{p.ts}</td>
                <td>{p.requests}</td>
                <td>${Number(p.cost_usd).toFixed(2)}</td>
                <td>{Number(p.p95_latency_ms).toFixed(0)} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: "#777", fontSize: 12, marginTop: 10 }}>
          Note: “P95” is placeholder (max). Replace with percentile calc later.
        </p>
      </div>
    </div>
  );
}
