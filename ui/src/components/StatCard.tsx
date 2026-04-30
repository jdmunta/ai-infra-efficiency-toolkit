export function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div style={{
      border: "1px solid #eee",
      borderRadius: 12,
      padding: 14,
      minWidth: 220
    }}>
      <div style={{ color: "#666", fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {hint ? <div style={{ color: "#777", fontSize: 12, marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
}
