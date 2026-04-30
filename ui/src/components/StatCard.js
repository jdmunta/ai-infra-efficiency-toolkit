import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const accentMap = {
    default: "text-gray-900",
    green: "text-emerald-600",
    red: "text-red-500",
    amber: "text-amber-500",
};
export function StatCard({ title, value, hint, accent = "default" }) {
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1 min-w-[180px]", children: [_jsx("span", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: title }), _jsx("span", { className: `text-2xl font-bold ${accentMap[accent]}`, children: value }), hint && _jsx("span", { className: "text-xs text-gray-400 mt-0.5", children: hint })] }));
}
