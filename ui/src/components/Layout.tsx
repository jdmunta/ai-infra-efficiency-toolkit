import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ margin: 0 }}>AI Infra Efficiency Toolkit</h2>
      <p style={{ marginTop: 6, color: "#555" }}>Cost • Routing • Cache • Performance</p>
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}
