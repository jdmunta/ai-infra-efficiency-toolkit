// All paths are relative — Vite dev proxy forwards /auth and /dashboard to localhost:8000.
// In production set VITE_API_BASE if the backend is on a different origin.
const BASE = import.meta.env.VITE_API_BASE || "";
async function get(path) {
    const r = await fetch(`${BASE}${path}`, { credentials: "include" });
    if (r.status === 401)
        throw Object.assign(new Error("Unauthorized"), { status: 401 });
    if (!r.ok)
        throw new Error(`${path} failed: ${r.status}`);
    return r.json();
}
// Auth
export async function getMe() {
    return get("/auth/me");
}
export async function logout() {
    await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" });
}
// Dashboard
export async function getSummary(days = 7) { return get(`/dashboard/summary?days=${days}`); }
export async function getTimeseries(days = 14) { return get(`/dashboard/timeseries?days=${days}`); }
export async function getCache(days = 7) { return get(`/dashboard/cache?days=${days}`); }
export async function getRouting(days = 7) { return get(`/dashboard/routing?days=${days}`); }
export async function getByTeam(days = 7) { return get(`/dashboard/by-team?days=${days}`); }
export async function getAlerts(days = 1) { return get(`/dashboard/alerts?days=${days}`); }
