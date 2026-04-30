const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function getSummary(days = 7) {
  const r = await fetch(`${BASE}/dashboard/summary?days=${days}`);
  if (!r.ok) throw new Error("summary failed");
  return r.json();
}

export async function getTimeseries(days = 14) {
  const r = await fetch(`${BASE}/dashboard/timeseries?days=${days}`);
  if (!r.ok) throw new Error("timeseries failed");
  return r.json();
}

export async function getCache(days = 7) {
  const r = await fetch(`${BASE}/dashboard/cache?days=${days}`);
  if (!r.ok) throw new Error("cache failed");
  return r.json();
}


export async function getRouting(days = 7) {
  const r = await fetch(`${BASE}/dashboard/routing?days=${days}`);
  if (!r.ok) throw new Error("routing failed");
  return r.json();
}
