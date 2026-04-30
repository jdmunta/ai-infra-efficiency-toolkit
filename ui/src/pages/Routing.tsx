import { useEffect, useState } from "react";
import { getRouting } from "../api";
import { StatCard } from "../components/StatCard";

function fmtUsd(x: number) {
  return `$${x.toFixed(4)}`;
}

export function Routing() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setData(await getRouting(7));
      } catch (e: any) {
        setErr(e?.message || "failed");
      }
    })();
  }, []);

  if (err) return <div style={{ color: "#b00" }}>Error: {err}</div>;
  if (!data) return <div>Loading…</div>;

  const totals = data.totals_usd || {};
  const savings = data.savings_vs_current || {};

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard title="Requests Considered" value={`${data.requests_considered}`} hint="Only requests with token counts" />
        <StatCard title="Current (USD)" value={fmtUsd(Number(totals.current || 0))} />
        <StatCard title="All Mini (USD)" value={fmtUsd(Number(totals.all_mini || 0))} hint={`Save ${savings.all_mini?.pct || 0}%`} />
        <StatCard title="Heuristic (USD)" value={fmtUsd(Number(totals.heuristic || 0))} hint={`Save ${savings.heuristic?.pct || 0}%`} />
      </div>

      <h3 style={{ marginTop: 22 }}>Savings vs Current</h3>
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th>Policy</th><th>Savings (USD)</th><th>Savings (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>All Mini</td>
              <td>{fmtUsd(Number(savings.all_mini?.usd || 0))}</td>
              <td>{Number(savings.all_mini?.pct || 0).toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Heuristic</td>
              <td>{fmtUsd(Number(savings.heuristic?.usd || 0))}</td>
              <td>{Number(savings.heuristic?.pct || 0).toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
        <p style={{ color: "#777", fontSize: 12, marginTop: 10 }}>
          Note: Heuristic uses privacy-safe routing features (codey + length bucket). For higher fidelity, log additional minimal features (tools, endpoint class).
        </p>
      </div>

      <h3 style={{ marginTop: 22 }}>Model Mix</h3>
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
        {["current", "all_mini", "heuristic"].map((k) => (
          <div key={k} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{k}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ textAlign: "left" }}><th>Model</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(data.model_mix?.[k] || {}).map(([m, c]: any) => (
                  <tr key={m}><td style={{ fontFamily: "monospace" }}>{m}</td><td>{c as any}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
