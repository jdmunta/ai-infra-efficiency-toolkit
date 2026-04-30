import json
import time
import uuid
from fastapi import FastAPI, Request, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .models import RequestLog
from .config import settings
from .providers.openai_provider import OpenAIProvider
from .routing.policy import choose_model
from .analytics.cost import compute_cost
from .analytics.cache import prompt_hash, prefix_hash
from .api.dashboard import router as dashboard_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Infra Efficiency Toolkit", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)

provider = OpenAIProvider()

INTERNAL_PREFIXES = ("/dashboard", "/health", "/admin")

def is_internal_path(p: str) -> bool:
    return any(p.startswith(x) for x in INTERNAL_PREFIXES)

def try_parse_json_body(raw: bytes):
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception:
        return None

def extract_promptish_text(payload: dict) -> str:
    msgs = payload.get("messages")
    if isinstance(msgs, list):
        parts = []
        for m in msgs:
            if isinstance(m, dict) and isinstance(m.get("content"), str):
                parts.append(m["content"])
        return "\n".join(parts)

    if isinstance(payload.get("input"), str):
        return payload["input"]
    if isinstance(payload.get("text"), str):
        return payload["text"]
    return ""

def is_codey(text: str) -> bool:
    t = (text or "")
    return ("```" in t) or ("class " in t) or ("def " in t) or ("SELECT " in t.upper())

def len_bucket(n: int) -> str:
    if n <= 300:
        return "0-300"
    if n <= 1200:
        return "300-1200"
    return "1200+"

def detect_has_tools(payload: dict) -> bool:
    if not isinstance(payload, dict):
        return False
    if payload.get("tools"):
        return True
    if payload.get("tool_choice"):
        return True
    msgs = payload.get("messages")
    if isinstance(msgs, list):
        for m in msgs:
            if isinstance(m, dict) and (m.get("tool_calls") or m.get("function_call")):
                return True
    return False


@app.get("/health")
def health():
    return {"status": "ok"}

@app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_any(full_path: str, request: Request, db: Session = Depends(get_db)):
    path = "/" + full_path
    if is_internal_path(path):
        return Response(status_code=404, content=b"Not found")

    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    team = request.headers.get("x-team") or "default"

    body = await request.body()
    params = dict(request.query_params)
    req_headers = {k.lower(): v for k, v in request.headers.items()}

    payload = try_parse_json_body(body)
    chosen_model = None
    prompt_text = ""
    feat_is_codey = False
    feat_bucket = "unknown"
    feat_has_tools = False

    if isinstance(payload, dict):
        if "model" in payload or settings.DEFAULT_MODEL:
            chosen_model = choose_model(payload, settings.DEFAULT_MODEL)
            payload["model"] = chosen_model
            body = json.dumps(payload).encode("utf-8")

        prompt_text = extract_promptish_text(payload)

        feat_is_codey = is_codey(prompt_text)
        feat_bucket = len_bucket(len(prompt_text))
        feat_has_tools = detect_has_tools(payload)

    t0 = time.perf_counter()
    status, data_or_bytes, resp_headers = await provider.forward(
        method=request.method,
        path=path,
        headers=req_headers,
        params=params,
        content=body,
    )
    latency_ms = (time.perf_counter() - t0) * 1000.0

    prompt_tokens = completion_tokens = total_tokens = 0
    estimated_cost = 0.0
    err_type = None

    if isinstance(data_or_bytes, dict):
        usage = data_or_bytes.get("usage") or {}
        prompt_tokens = int(usage.get("prompt_tokens") or 0)
        completion_tokens = int(usage.get("completion_tokens") or 0)
        total_tokens = int(usage.get("total_tokens") or (prompt_tokens + completion_tokens))

        if chosen_model:
            estimated_cost = compute_cost(chosen_model, prompt_tokens, completion_tokens)

        if status >= 400:
            err_type = (data_or_bytes.get("error") or {}).get("type")

    p_hash = prompt_hash(prompt_text) if prompt_text else ""
    pp_hash = prefix_hash(prompt_text, n=200) if prompt_text else ""

    model_for_log = "unknown"
    if chosen_model:
        model_for_log = chosen_model
    elif isinstance(payload, dict) and isinstance(payload.get("model"), str):
        model_for_log = payload["model"]

    log = RequestLog(
        request_id=request_id,
        team=team,
        endpoint=path,
        provider="openai",
        model=model_for_log,
        prompt_hash=p_hash,
        prompt_prefix_hash=pp_hash,
        prompt_chars=len(prompt_text) if prompt_text else 0,
        completion_chars=0,
        is_codey=feat_is_codey,
        prompt_len_bucket=feat_bucket,
        has_tools=feat_has_tools,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        latency_ms=latency_ms,
        status_code=status,
        error_type=err_type,
        estimated_cost_usd=float(estimated_cost),
        prompt_preview=(prompt_text[:280] if (prompt_text and settings.STORE_PROMPT_PREVIEW) else None),
    )
    db.add(log)
    db.commit()

    if isinstance(data_or_bytes, dict):
        return data_or_bytes

    content_type = resp_headers.get("content-type", "application/octet-stream")
    return Response(content=data_or_bytes, status_code=status, media_type=content_type)
