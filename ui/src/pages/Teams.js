import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, } from "recharts";
import { getByTeam, getAlerts } from "../api";
function Spinner() {
    return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" }) }));
}
export function Teams() {
    const [teams, setTeams] = useState([]);
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([getByTeam(7), getAlerts(1)])
            .then(([t, a]) => { setTeams(t); setAlerts(a); })
            .finally(() => setLoading(false));
    }, []);
    if (loading)
        return _jsx(Spinner, {});
    const triggered = alerts?.alerts || [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Teams" }), _jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "Cost and usage breakdown by team \u00B7 7-day window" })] }), triggered.length > 0 && (_jsx("div", { className: "space-y-2", children: triggered.map((a) => (_jsxs("div", { className: `flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${a.status === "over_budget"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-amber-50 border-amber-200 text-amber-800"}`, children: [_jsxs("span", { className: "font-semibold", children: [a.status === "over_budget" ? "🚨" : "⚠️", " ", a.team] }), _jsxs("span", { children: ["has used ", _jsxs("strong", { children: ["$", a.spent_usd] }), " of ", _jsxs("strong", { children: ["$", a.budget_usd] }), " daily budget (", a.pct_used, "%)"] })] }, a.team))) })), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-4", children: "Cost by Team" }), teams.length === 0 ? (_jsxs("p", { className: "text-sm text-gray-400", children: ["No data. Add ", _jsx("code", { className: "bg-gray-100 px-1 rounded", children: "x-team: <name>" }), " headers to your requests."] })) : (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: teams, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "team", tick: { fontSize: 11 }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11 }, tickLine: false, axisLine: false, tickFormatter: (v) => `$${v.toFixed(4)}` }), _jsx(Tooltip, { formatter: (v) => [`$${v.toFixed(6)}`, "Cost"] }), _jsx(Bar, { dataKey: "total_cost_usd", fill: "#6366f1", radius: [4, 4, 0, 0], name: "Cost ($)" })] }) }))] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-4", children: "Team Breakdown" }), teams.length === 0 ? (_jsx("p", { className: "text-sm text-gray-400", children: "No team data found in the current window." })) : (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-gray-100", children: ["Team", "Requests", "Cost", "Avg Latency"].map((h) => (_jsx("th", { className: `pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === "Team" ? "text-left" : "text-right"}`, children: h }, h))) }) }), _jsx("tbody", { children: teams.map((t, i) => (_jsxs("tr", { className: i % 2 === 0 ? "bg-gray-50/50" : "", children: [_jsx("td", { className: "py-2.5 font-medium text-gray-800", children: t.team }), _jsx("td", { className: "py-2.5 text-right text-gray-600", children: t.requests.toLocaleString() }), _jsxs("td", { className: "py-2.5 text-right font-semibold text-gray-800", children: ["$", t.total_cost_usd.toFixed(6)] }), _jsxs("td", { className: "py-2.5 text-right text-gray-600", children: [t.avg_latency_ms.toFixed(0), " ms"] })] }, t.team))) })] }))] })] }));
}
