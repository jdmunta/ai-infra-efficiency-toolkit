from collections import defaultdict
from datetime import datetime, timedelta

import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import RequestLog
from ..pricing import estimate_cost_usd
from ..schemas import CacheStats, DashboardSummary, TimeSeriesPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)

    total = db.query(func.count(RequestLog.id)).filter(RequestLog.created_at >= since).scalar() or 0
    cost = db.query(func.sum(RequestLog.estimated_cost_usd)).filter(RequestLog.created_at >= since).scalar() or 0.0
    avg_lat = db.query(func.avg(RequestLog.latency_ms)).filter(RequestLog.created_at >= since).scalar() or 0.0
    errors = db.query(func.count(RequestLog.id)).filter(
        RequestLog.created_at >= since, RequestLog.status_code >= 400
    ).scalar() or 0

    return DashboardSummary(
        total_requests=total,
        total_cost_usd=float(cost),
        avg_latency_ms=float(avg_lat),
        error_rate=float(errors / total) if total else 0.0,
    )


@router.get("/timeseries", response_model=list[TimeSeriesPoint])
def timeseries(days: int = 14, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)

    rows = (
        db.query(
            func.strftime("%Y-%m-%d", RequestLog.created_at).label("d"),
            func.sum(RequestLog.estimated_cost_usd).label("cost"),
            func.count(RequestLog.id).label("req"),
        )
        .filter(RequestLog.created_at >= since)
        .group_by("d")
        .order_by("d")
        .all()
    )

    # Fetch raw latencies for accurate p95 per day
    lat_rows = (
        db.query(
            func.strftime("%Y-%m-%d", RequestLog.created_at).label("d"),
            RequestLog.latency_ms,
        )
        .filter(RequestLog.created_at >= since)
        .all()
    )

    day_lats: dict = defaultdict(list)
    for lr in lat_rows:
        day_lats[lr.d].append(float(lr.latency_ms or 0))

    def p95(lats: list) -> float:
        return float(np.percentile(lats, 95)) if lats else 0.0

    return [
        TimeSeriesPoint(
            ts=r.d,
            cost_usd=float(r.cost or 0),
            requests=int(r.req or 0),
            p95_latency_ms=p95(day_lats.get(r.d, [])),
        )
        for r in rows
    ]


@router.get("/cache", response_model=CacheStats)
def cache_stats(days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)

    total = db.query(func.count(RequestLog.id)).filter(RequestLog.created_at >= since).scalar() or 0
    if not total:
        return CacheStats(duplicate_prompt_rate=0.0, prefix_overlap_rate=0.0, top_duplicates=[])

    dup_rows = (
        db.query(RequestLog.prompt_hash, func.count(RequestLog.id).label("c"))
        .filter(RequestLog.created_at >= since, RequestLog.prompt_hash != "")
        .group_by(RequestLog.prompt_hash)
        .having(func.count(RequestLog.id) >= 2)
        .order_by(func.count(RequestLog.id).desc())
        .limit(20)
        .all()
    )
    dup_calls = sum(int(r.c) for r in dup_rows)

    pref_rows = (
        db.query(RequestLog.prompt_prefix_hash, func.count(RequestLog.id).label("c"))
        .filter(RequestLog.created_at >= since, RequestLog.prompt_prefix_hash != "")
        .group_by(RequestLog.prompt_prefix_hash)
        .having(func.count(RequestLog.id) >= 2)
        .order_by(func.count(RequestLog.id).desc())
        .limit(20)
        .all()
    )
    pref_calls = sum(int(r.c) for r in pref_rows)

    return CacheStats(
        duplicate_prompt_rate=float(dup_calls / total),
        prefix_overlap_rate=float(pref_calls / total),
        top_duplicates=[{"prompt_hash": r.prompt_hash, "count": int(r.c)} for r in dup_rows],
    )


@router.get("/by-team")
def by_team(days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)

    rows = (
        db.query(
            RequestLog.team,
            func.count(RequestLog.id).label("requests"),
            func.sum(RequestLog.estimated_cost_usd).label("cost"),
            func.avg(RequestLog.latency_ms).label("avg_latency"),
        )
        .filter(RequestLog.created_at >= since)
        .group_by(RequestLog.team)
        .order_by(func.sum(RequestLog.estimated_cost_usd).desc())
        .all()
    )

    return [
        {
            "team": r.team,
            "requests": int(r.requests or 0),
            "total_cost_usd": round(float(r.cost or 0), 6),
            "avg_latency_ms": round(float(r.avg_latency or 0), 2),
        }
        for r in rows
    ]


@router.get("/alerts")
def alerts(days: int = 1, db: Session = Depends(get_db)):
    budgets = settings.team_budgets
    if not budgets:
        return {"alerts": [], "note": "No budgets configured. Set TEAM_BUDGETS_JSON, e.g. '{\"default\": 5.0}'"}

    since = datetime.utcnow() - timedelta(days=days)

    spend_rows = (
        db.query(RequestLog.team, func.sum(RequestLog.estimated_cost_usd).label("cost"))
        .filter(RequestLog.created_at >= since)
        .group_by(RequestLog.team)
        .all()
    )
    spend = {r.team: float(r.cost or 0) for r in spend_rows}

    triggered = []
    for team, budget in budgets.items():
        current = spend.get(team, 0.0)
        pct = (current / budget * 100) if budget > 0 else 0.0
        if pct >= 80:
            triggered.append({
                "team": team,
                "budget_usd": budget,
                "spent_usd": round(current, 6),
                "pct_used": round(pct, 1),
                "status": "over_budget" if pct >= 100 else "warning",
            })

    return {"alerts": triggered, "window_days": days}


@router.get("/routing")
def routing_simulation(days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    rows = db.query(RequestLog).filter(RequestLog.created_at >= since).all()
    sim_rows = [r for r in rows if (r.prompt_tokens or 0) + (r.completion_tokens or 0) > 0]

    def cost_for(model: str, r: RequestLog) -> float:
        return float(estimate_cost_usd(model, int(r.prompt_tokens or 0), int(r.completion_tokens or 0)))

    def heuristic_model(r: RequestLog) -> str:
        if (not bool(getattr(r, "is_codey", False))) and (getattr(r, "prompt_len_bucket", "unknown") in ("0-300", "300-1200")):
            return "gpt-4o-mini"
        m = r.model or "unknown"
        return m if m != "unknown" else "gpt-4o-mini"

    totals = {"current": 0.0, "all_mini": 0.0, "heuristic": 0.0}
    model_mix: dict = {"current": {}, "all_mini": {}, "heuristic": {}}

    for r in sim_rows:
        m_current = r.model or "unknown"
        m_heur = heuristic_model(r)

        totals["current"] += cost_for(m_current, r)
        totals["all_mini"] += cost_for("gpt-4o-mini", r)
        totals["heuristic"] += cost_for(m_heur, r)

        for policy, model in [("current", m_current), ("all_mini", "gpt-4o-mini"), ("heuristic", m_heur)]:
            model_mix[policy][model] = model_mix[policy].get(model, 0) + 1

    def pct_savings(base: float, alt: float) -> float:
        return float(((base - alt) / base) if base > 0 else 0.0)

    return {
        "window_days": days,
        "requests_considered": len(sim_rows),
        "totals_usd": {k: round(v, 6) for k, v in totals.items()},
        "savings_vs_current": {
            "all_mini": {
                "usd": round(totals["current"] - totals["all_mini"], 6),
                "pct": round(pct_savings(totals["current"], totals["all_mini"]) * 100, 3),
            },
            "heuristic": {
                "usd": round(totals["current"] - totals["heuristic"], 6),
                "pct": round(pct_savings(totals["current"], totals["heuristic"]) * 100, 3),
            },
        },
        "model_mix": model_mix,
        "notes": [
            "Simulation only includes requests with non-zero token counts.",
            "Heuristic uses stored routing features (is_codey, prompt_len_bucket).",
        ],
    }
