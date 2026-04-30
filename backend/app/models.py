from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index, Boolean
from sqlalchemy.sql import func
from .db import Base

class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    request_id = Column(String(64), index=True)
    team = Column(String(128), default="default", index=True)
    endpoint = Column(String(256), default="", index=True)

    provider = Column(String(64), default="openai", index=True)
    model = Column(String(128), index=True)

    prompt_hash = Column(String(64), index=True)
    prompt_prefix_hash = Column(String(64), index=True)
    prompt_chars = Column(Integer, default=0)
    completion_chars = Column(Integer, default=0)

    # Minimal routing features (privacy-safe)
    is_codey = Column(Boolean, default=False, index=True)
    prompt_len_bucket = Column(String(32), default="unknown", index=True)
    has_tools = Column(Boolean, default=False, index=True)

    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)

    latency_ms = Column(Float, default=0)
    status_code = Column(Integer, default=200)
    error_type = Column(String(128), nullable=True)

    estimated_cost_usd = Column(Float, default=0.0)

    prompt_preview = Column(Text, nullable=True)

Index("ix_req_team_time", RequestLog.team, RequestLog.created_at)
Index("ix_req_model_time", RequestLog.model, RequestLog.created_at)
Index("ix_req_prompt_hash_time", RequestLog.prompt_hash, RequestLog.created_at)
Index("ix_req_endpoint_time", RequestLog.endpoint, RequestLog.created_at)
