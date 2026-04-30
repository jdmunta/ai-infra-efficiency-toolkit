import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  BarChart2, Database, GitBranch, Users, Activity, LogOut, Zap,
} from "lucide-react";

const nav = [
  { to: "/", label: "Cost",        icon: BarChart2,  end: true },
  { to: "/cache", label: "Cache",  icon: Database },
  { to: "/routing", label: "Routing", icon: GitBranch },
  { to: "/teams",   label: "Teams",   icon: Users },
  { to: "/performance", label: "Performance", icon: Activity },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 flex flex-col shrink-0 select-none">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight">AI Infra</div>
            <div className="text-gray-500 text-[10px] leading-tight">Efficiency Toolkit</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="px-3 py-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-7 h-7 rounded-full shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-xs font-semibold">
                  {(user.name || user.email || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">{user.name || user.email}</div>
                <div className="text-gray-500 text-[10px] truncate">{user.email}</div>
              </div>
            </div>
            {user.auth_enabled && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs font-medium transition-colors mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
