import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, } from "recharts";
import { getSummary, getTimeseries } from "../api";
import { StatCard } from "../components/StatCard";
function Spinner() {
    return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" }) }));
}
function ChartCard({ title, children }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-4", children: title }), children] }));
}
export function Cost() {
    const [summary, setSummary] = useState(null);
    const [series, setSeries] = useState([]);
    useEffect(() => {
        getSummary(7).then(setSummary);
        getTimeseries(14).then(setSeries);
    }, []);
    if (!summary)
        return _jsx(Spinner, {});
    const errorPct = (summary.error_rate * 100).toFixed(2);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Cost Overview" }), _jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "Last 7 days \u00B7 refreshed on load" })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(StatCard, { title: "Total Requests", value: summary.total_requests.toLocaleString(), hint: "7-day window" }), _jsx(StatCard, { title: "Estimated Cost", value: `$${summary.total_cost_usd.toFixed(4)}`, hint: "from usage fields", accent: "green" }), _jsx(StatCard, { title: "Avg Latency", value: `${summary.avg_latency_ms.toFixed(0)} ms` }), _jsx(StatCard, { title: "Error Rate", value: `${errorPct}%`, accent: summary.error_rate > 0.05 ? "red" : "default" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(ChartCard, { title: "Daily Cost (14d)", children: _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(LineChart, { data: series, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "ts", tick: { fontSize: 11 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11 }, tickLine: false, axisLine: false, tickFormatter: (v) => `$${v.toFixed(3)}` }), _jsx(Tooltip, { formatter: (v) => [`$${v.toFixed(5)}`, "Cost"] }), _jsx(Line, { type: "monotone", dataKey: "cost_usd", stroke: "#6366f1", strokeWidth: 2, dot: { r: 3, fill: "#6366f1" }, name: "Cost ($)" })] }) }) }), _jsx(ChartCard, { title: "Daily Requests (14d)", children: _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: series, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "ts", tick: { fontSize: 11 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11 }, tickLine: false, axisLine: false }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "requests", fill: "#8b5cf6", radius: [4, 4, 0, 0], name: "Requests" })] }) }) })] }), _jsx(ChartCard, { title: "P95 Latency Trend (14d)", children: _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(LineChart, { data: series, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "ts", tick: { fontSize: 11 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11 }, tickLine: false, axisLine: false, tickFormatter: (v) => `${v}ms` }), _jsx(Tooltip, { formatter: (v) => [`${v.toFixed(0)} ms`, "P95"] }), _jsx(Line, { type: "monotone", dataKey: "p95_latency_ms", stroke: "#f59e0b", strokeWidth: 2, dot: { r: 3, fill: "#f59e0b" }, name: "P95 (ms)" })] }) }) })] }));
}
