import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BarChart2, Database, GitBranch, Users, Activity, LogOut, Zap, } from "lucide-react";
const nav = [
    { to: "/", label: "Cost", icon: BarChart2, end: true },
    { to: "/cache", label: "Cache", icon: Database },
    { to: "/routing", label: "Routing", icon: GitBranch },
    { to: "/teams", label: "Teams", icon: Users },
    { to: "/performance", label: "Performance", icon: Activity },
];
export function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    async function handleLogout() {
        await logout();
        navigate("/login");
    }
    return (_jsxs("div", { className: "flex h-full bg-gray-50", children: [_jsxs("aside", { className: "w-60 bg-gray-900 flex flex-col shrink-0 select-none", children: [_jsxs("div", { className: "flex items-center gap-2.5 px-5 py-5 border-b border-gray-800", children: [_jsx("div", { className: "w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0", children: _jsx(Zap, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-white text-sm font-semibold leading-tight", children: "AI Infra" }), _jsx("div", { className: "text-gray-500 text-[10px] leading-tight", children: "Efficiency Toolkit" })] })] }), _jsx("nav", { className: "flex-1 px-3 py-4 space-y-0.5", children: nav.map(({ to, label, icon: Icon, end }) => (_jsxs(NavLink, { to: to, end: end, className: ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? "bg-indigo-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-800"}`, children: [_jsx(Icon, { className: "w-4 h-4 shrink-0" }), label] }, to))) }), user && (_jsxs("div", { className: "px-3 py-4 border-t border-gray-800", children: [_jsxs("div", { className: "flex items-center gap-3 px-3 py-2 rounded-lg", children: [user.picture ? (_jsx("img", { src: user.picture, alt: "", className: "w-7 h-7 rounded-full shrink-0" })) : (_jsx("div", { className: "w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-xs font-semibold", children: (user.name || user.email || "?")[0].toUpperCase() })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-white text-xs font-medium truncate", children: user.name || user.email }), _jsx("div", { className: "text-gray-500 text-[10px] truncate", children: user.email })] })] }), user.auth_enabled && (_jsxs("button", { onClick: handleLogout, className: "flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs font-medium transition-colors mt-1", children: [_jsx(LogOut, { className: "w-3.5 h-3.5" }), "Sign out"] }))] }))] }), _jsx("div", { className: "flex-1 flex flex-col overflow-hidden", children: _jsx("main", { className: "flex-1 overflow-y-auto p-6", children: _jsx(Outlet, {}) }) })] }));
}
