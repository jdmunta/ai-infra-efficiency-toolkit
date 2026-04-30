import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<Cost />} />
            <Route path="cache" element={<Cache />} />
            <Route path="routing" element={<Routing />} />
            <Route path="teams" element={<Teams />} />
            <Route path="performance" element={<Performance />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
