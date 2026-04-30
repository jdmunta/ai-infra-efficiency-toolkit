import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { Layout } from "./components/Layout";
import { Cost } from "./pages/Cost";
import { Cache } from "./pages/Cache";
import { Routing } from "./pages/Routing";
import { Performance } from "./pages/Performance";

function App() {
  const [tab, setTab] = useState<"cost"|"routing"|"cache"|"perf">("cost");

  const TabBtn = ({ id, label }: any) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: tab === id ? "#111" : "#fff",
        color: tab === id ? "#fff" : "#111",
        cursor: "pointer"
      }}
    >
      {label}
    </button>
  );

  return (
    <Layout>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <TabBtn id="cost" label="Cost" />
        <TabBtn id="routing" label="Routing" />
        <TabBtn id="cache" label="Cache" />
        <TabBtn id="perf" label="Performance" />
      </div>

      {tab === "cost" && <Cost />}
      {tab === "routing" && <Routing />}
      {tab === "cache" && <Cache />}
      {tab === "perf" && <Performance />}
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
