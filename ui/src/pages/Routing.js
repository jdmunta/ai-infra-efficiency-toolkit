import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from "recharts";
import { getRouting } from "../api";
import { StatCard } from "../components/StatCard";
function Spinner() {
    return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" }) }));
}
export function Routing() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => {
        getRouting(7).then(setData).catch((e) => setErr(e.message));
    }, []);
    if (err)
        return _jsx("p", { className: "text-red-500 text-sm", children: err });
    if (!data)
        return _jsx(Spinner, {});
    const totals = data.totals_usd || {};
    const savings = data.savings_vs_current || {};
    const policyChartData = [
        { policy: "Current", cost: totals.current || 0 },
        { policy: "All Mini", cost: totals.all_mini || 0 },
        { policy: "Heuristic", cost: totals.heuristic || 0 },
    ];
    const mix = data.model_mix || {};
    const allModels = Array.from(new Set(Object.values(mix).flatMap((m) => Object.keys(m))));
    const mixChartData = Object.entries(mix).map(([policy, counts]) => ({
        policy,
        ...counts,
    }));
    const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Routing Simulation" }), _jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "Counterfactual cost under three routing policies \u00B7 7-day window" })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(StatCard, { title: "Requests Considered", value: data.requests_considered.toLocaleString(), hint: "With token counts" }), _jsx(StatCard, { title: "Current Cost", value: `$${Number(totals.current || 0).toFixed(5)}` }), _jsx(StatCard, { title: "All-Mini Cost", value: `$${Number(totals.all_mini || 0).toFixed(5)}`, hint: `Save ${savings.all_mini?.pct?.toFixed(1) || 0}%`, accent: "green" }), _jsx(StatCard, { title: "Heuristic Cost", value: `$${Number(totals.heuristic || 0).toFixed(5)}`, hint: `Save ${savings.heuristic?.pct?.toFixed(1) || 0}%`, accent: "green" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-4", children: "Cost by Policy" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: policyChartData, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "policy", tick: { fontSize: 11 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11 }, tickLine: false, axisLine: false, tickFormatter: (v) => `$${v.toFixed(4)}` }), _jsx(Tooltip, { formatter: (v) => [`$${v.toFixed(6)}`, "Cost"] }), _jsx(Bar, { dataKey: "cost", radius: [4, 4, 0, 0], fill: "#6366f1" })] }) })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-4", children: "Model Mix by Policy" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: mixChartData, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "policy", tick: { fontSize: 11 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11 }, tickLine: false, axisLine: false }), _jsx(Tooltip, {}), _jsx(Legend, { iconSize: 10, iconType: "circle", wrapperStyle: { fontSize: 11 } }), allModels.map((m, i) => (_jsx(Bar, { dataKey: m, stackId: "a", fill: COLORS[i % COLORS.length], radius: i === allModels.length - 1 ? [4, 4, 0, 0] : undefined }, m)))] }) })] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-4", children: "Savings vs Current" }), _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-100", children: [_jsx("th", { className: "text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide", children: "Policy" }), _jsx("th", { className: "text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide", children: "USD Saved" }), _jsx("th", { className: "text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide", children: "% Saved" })] }) }), _jsx("tbody", { children: [["All Mini", "all_mini"], ["Heuristic", "heuristic"]].map(([label, key]) => (_jsxs("tr", { className: "border-b border-gray-50", children: [_jsx("td", { className: "py-3 font-medium text-gray-700", children: label }), _jsxs("td", { className: "py-3 text-right text-emerald-600 font-semibold", children: ["$", Number(savings[key]?.usd || 0).toFixed(6)] }), _jsx("td", { className: "py-3 text-right", children: _jsxs("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700", children: [Number(savings[key]?.pct || 0).toFixed(2), "%"] }) })] }, key))) })] }), _jsx("p", { className: "text-xs text-gray-400 mt-4", children: "Simulation uses stored features (is_codey, prompt_len_bucket). Only requests with non-zero token counts are included." })] })] }));
}
