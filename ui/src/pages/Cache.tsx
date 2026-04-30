import { useEffect, useState } from "react";
import { getCache } from "../api";
import { StatCard } from "../components/StatCard";

export function Cache() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => setData(await getCache(7)))();
  }, []);

  if (!data) return <div>Loading…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard title="Duplicate Prompt Rate" value={`${(data.duplicate_prompt_rate * 100).toFixed(2)}%`} />
        <StatCard title="Prefix Overlap Rate" value={`${(data.prefix_overlap_rate * 100).toFixed(2)}%`} />
      </div>

      <h3 style={{ marginTop: 22 }}>Top Duplicate Prompts (hash)</h3>
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>Prompt Hash</th><th>Count</th></tr></thead>
          <tbody>
            {(data.top_duplicates || []).map((r: any) => (
              <tr key={r.prompt_hash}>
                <td style={{ fontFamily: "monospace" }}>{r.prompt_hash.slice(0, 16)}…</td>
                <td>{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
