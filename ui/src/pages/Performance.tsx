export function Performance() {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <h3 style={{ marginTop: 0 }}>Performance</h3>
      <p style={{ color: "#555" }}>
        Next: backend endpoint /dashboard/perf for p50/p95/p99, tokens/sec, error rate by model and endpoint.
      </p>
    </div>
  );
}
