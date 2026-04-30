from pydantic import BaseModel
from typing import List, Dict, Any

class DashboardSummary(BaseModel):
    total_requests: int
    total_cost_usd: float
    avg_latency_ms: float
    error_rate: float

class TimeSeriesPoint(BaseModel):
    ts: str
    cost_usd: float
    requests: int
    p95_latency_ms: float

class CacheStats(BaseModel):
    duplicate_prompt_rate: float
    prefix_overlap_rate: float
    top_duplicates: List[Dict[str, Any]]
