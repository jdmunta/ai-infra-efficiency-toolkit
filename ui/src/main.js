import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Cost } from "./pages/Cost";
import { Cache } from "./pages/Cache";
import { Routing } from "./pages/Routing";
import { Teams } from "./pages/Teams";
import { Performance } from "./pages/Performance";
function ProtectedLayout() {
    const { user, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("div", { className: "w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" }) }));
    }
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return (_jsx(Layout, {}));
}
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { element: _jsx(ProtectedLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(Cost, {}) }), _jsx(Route, { path: "cache", element: _jsx(Cache, {}) }), _jsx(Route, { path: "routing", element: _jsx(Routing, {}) }), _jsx(Route, { path: "teams", element: _jsx(Teams, {}) }), _jsx(Route, { path: "performance", element: _jsx(Performance, {}) })] })] }) }) }) }));
