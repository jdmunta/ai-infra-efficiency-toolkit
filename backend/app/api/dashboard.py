from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from ..db import get_db
from ..models import RequestLog
from ..schemas import DashboardSummary, TimeSeriesPoint, CacheStats

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

    error_rate = (errors / total) if total else 0.0
    return DashboardSummary(
        total_requests=total,
        total_cost_usd=float(cost),
        avg_latency_ms=float(avg_lat),
        error_rate=float(error_rate),
    )

@router.get("/timeseries", response_model=list[TimeSeriesPoint])
def timeseries(days: int = 14, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)

    rows = (
        db.query(
            func.strftime("%Y-%m-%d", RequestLog.created_at).label("d"),
            func.sum(RequestLog.estimated_cost_usd).label("cost"),
            func.count(RequestLog.id).label("req"),
            func.max(RequestLog.latency_ms).label("p95")  # MVP placeholder
        )
        .filter(RequestLog.created_at >= since)
        .group_by("d")
        .order_by("d")
        .all()
    )

    return [
        TimeSeriesPoint(ts=r.d, cost_usd=float(r.cost or 0), requests=int(r.req or 0), p95_latency_ms=float(r.p95 or 0))
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
    duplicate_prompt_rate = dup_calls / total

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
    prefix_overlap_rate = pref_calls / total

    return CacheStats(
        duplicate_prompt_rate=float(duplicate_prompt_rate),
        prefix_overlap_rate=float(prefix_overlap_rate),
        top_duplicates=[{"prompt_hash": r.prompt_hash, "count": int(r.c)} for r in dup_rows],
    )


from ..pricing import estimate_cost_usd

def _is_codey_text(text: str) -> bool:
    t = text or ""
    return ("```" in t) or ("class " in t) or ("def " in t) or ("SELECT " in t.upper())

def _heuristic_model_from_features(model: str, is_codey: bool, bucket: str, default_model: str = "gpt-4o-mini") -> str:
    """Heuristic routing based on stored, privacy-safe features."""
    if (not is_codey) and bucket in ("0-300", "300-1200"):
        return "gpt-4o-mini"
    return model if model and model != "unknown" else default_model


@router.get("/routing")
def routing_simulation(days: int = 7, db: Session = Depends(get_db)):
    """Simulate spend under simple routing policies using logged token counts.

    Policies:
    - current: use logged model + tokens
    - all_mini: force gpt-4o-mini
    - heuristic: text-based heuristic using prompt_preview
    """
    since = datetime.utcnow() - timedelta(days=days)

    rows = db.query(RequestLog).filter(RequestLog.created_at >= since).all()

    # Only include rows with token counts (else simulation becomes meaningless)
    sim_rows = [r for r in rows if (r.prompt_tokens or 0) + (r.completion_tokens or 0) > 0]

    def cost_for(model: str, r: RequestLog) -> float:
        return float(estimate_cost_usd(model, int(r.prompt_tokens or 0), int(r.completion_tokens or 0)))

    totals = {"current": 0.0, "all_mini": 0.0, "heuristic": 0.0}
    model_mix = {"current": {}, "all_mini": {}, "heuristic": {}}

    for r in sim_rows:
        current_model = r.model or "unknown"
        m_current = current_model
        m_all_mini = "gpt-4o-mini"
        m_heur = _heuristic_model_from_features(current_model, bool(getattr(r, "is_codey", False)), getattr(r, "prompt_len_bucket", "unknown") or "unknown", default_model="gpt-4o-mini")

        totals["current"] += cost_for(m_current, r)
        totals["all_mini"] += cost_for(m_all_mini, r)
        totals["heuristic"] += cost_for(m_heur, r)

        model_mix["current"][m_current] = model_mix["current"].get(m_current, 0) + 1
        model_mix["all_mini"][m_all_mini] = model_mix["all_mini"].get(m_all_mini, 0) + 1
        model_mix["heuristic"][m_heur] = model_mix["heuristic"].get(m_heur, 0) + 1

    def pct_savings(base: float, alt: float) -> float:
        return float(((base - alt) / base) if base > 0 else 0.0)

    resp = {
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
            "Heuristic uses stored routing features (is_codey, prompt_len_bucket). For full-fidelity routing, store additional minimal features (e.g., tool usage, endpoint class).",
        ],
    }
    return resp
