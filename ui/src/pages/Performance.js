import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, } from "recharts";
import { getSummary, getTimeseries } from "../api";
import { StatCard } from "../components/StatCard";
function Spinner() {
    return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" }) }));
}
export function Performance() {
    const [summary, setSummary] = useState(null);
    const [series, setSeries] = useState([]);
    useEffect(() => {
        getSummary(7).then(setSummary);
        getTimeseries(14).then(setSeries);
    }, []);
    if (!summary)
        return _jsx(Spinner, {});
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Performance" }), _jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "Latency and error trends \u00B7 7-day / 14-day windows" })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsx(StatCard, { title: "Avg Latency", value: `${summary.avg_latency_ms.toFixed(0)} ms`, hint: "7-day average" }), _jsx(StatCard, { title: "Error Rate", value: `${(summary.error_rate * 100).toFixed(2)}%`, accent: summary.error_rate > 0.05 ? "red" : "default", hint: "4xx + 5xx over total" }), _jsx(StatCard, { title: "Total Requests", value: summary.total_requests.toLocaleString(), hint: "7-day window" })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-4", children: "P95 Latency (14d)" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(AreaChart, { data: series, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "latGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#f59e0b", stopOpacity: 0.15 }), _jsx("stop", { offset: "95%", stopColor: "#f59e0b", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "ts", tick: { fontSize: 11 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11 }, tickLine: false, axisLine: false, tickFormatter: (v) => `${v}ms` }), _jsx(Tooltip, { formatter: (v) => [`${v.toFixed(0)} ms`, "P95"] }), _jsx(Area, { type: "monotone", dataKey: "p95_latency_ms", stroke: "#f59e0b", strokeWidth: 2, fill: "url(#latGrad)", dot: { r: 3, fill: "#f59e0b" }, name: "P95 (ms)" })] }) })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-4", children: "Request Volume (14d)" }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(AreaChart, { data: series, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "reqGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#6366f1", stopOpacity: 0.15 }), _jsx("stop", { offset: "95%", stopColor: "#6366f1", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "ts", tick: { fontSize: 11 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11 }, tickLine: false, axisLine: false }), _jsx(Tooltip, {}), _jsx(Area, { type: "monotone", dataKey: "requests", stroke: "#6366f1", strokeWidth: 2, fill: "url(#reqGrad)", dot: { r: 3, fill: "#6366f1" }, name: "Requests" })] }) })] })] }));
}
