import hashlib
import json
import time
import uuid

from fastapi import FastAPI, Request, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .models import RequestLog
from .config import settings
from .utils import is_codey, len_bucket, detect_has_tools
from .providers.openai_provider import OpenAIProvider
from .routing.policy import choose_model
from .analytics.cost import compute_cost
from .analytics.cache import prompt_hash, prefix_hash
from .cache_store import LRUCache
from .api.dashboard import router as dashboard_router
from .api.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Infra Efficiency Toolkit", version="0.5.0")

_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(auth_router)

provider = OpenAIProvider()
_response_cache: LRUCache = LRUCache(maxsize=settings.CACHE_MAX_SIZE)

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
        parts = [
            m["content"]
            for m in msgs
            if isinstance(m, dict) and isinstance(m.get("content"), str)
        ]
        return "\n".join(parts)
    if isinstance(payload.get("input"), str):
        return payload["input"]
    if isinstance(payload.get("text"), str):
        return payload["text"]
    return ""


def _cache_key(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def _write_log(
    db: Session,
    *,
    request_id: str,
    team: str,
    path: str,
    chosen_model: str | None,
    payload,
    prompt_text: str,
    feat_is_codey: bool,
    feat_bucket: str,
    feat_has_tools: bool,
    response_data,
    latency_ms: float,
    status_code: int,
    err_type: str | None,
) -> None:
    prompt_tokens = completion_tokens = total_tokens = 0
    estimated_cost = 0.0

    if isinstance(response_data, dict):
        usage = response_data.get("usage") or {}
        prompt_tokens = int(usage.get("prompt_tokens") or 0)
        completion_tokens = int(usage.get("completion_tokens") or 0)
        total_tokens = int(usage.get("total_tokens") or (prompt_tokens + completion_tokens))
        if chosen_model:
            estimated_cost = compute_cost(chosen_model, prompt_tokens, completion_tokens)

    p_hash = prompt_hash(prompt_text) if prompt_text else ""
    pp_hash = prefix_hash(prompt_text, n=200) if prompt_text else ""

    model_for_log = chosen_model or (
        payload.get("model") if isinstance(payload, dict) and isinstance(payload.get("model"), str) else "unknown"
    )

    db.add(RequestLog(
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
        status_code=status_code,
        error_type=err_type,
        estimated_cost_usd=float(estimated_cost),
        prompt_preview=(prompt_text[:280] if (prompt_text and settings.STORE_PROMPT_PREVIEW) else None),
    ))
    db.commit()


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if settings.GATEWAY_API_KEY:
        path = request.url.path
        is_proxy = not any(path.startswith(x) for x in INTERNAL_PREFIXES)
        if is_proxy:
            if request.headers.get("x-gateway-key", "") != settings.GATEWAY_API_KEY:
                return Response(status_code=401, content=b"Unauthorized")
    return await call_next(request)


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
    is_streaming = False

    if isinstance(payload, dict):
        is_streaming = payload.get("stream") is True

        if "model" in payload or settings.DEFAULT_MODEL:
            chosen_model = choose_model(payload, settings.DEFAULT_MODEL)
            payload["model"] = chosen_model
            body = json.dumps(payload).encode("utf-8")

        prompt_text = extract_promptish_text(payload)
        feat_is_codey = is_codey(prompt_text)
        feat_bucket = len_bucket(len(prompt_text))
        feat_has_tools = detect_has_tools(payload)

    log_kwargs = dict(
        request_id=request_id,
        team=team,
        path=path,
        chosen_model=chosen_model,
        payload=payload,
        prompt_text=prompt_text,
        feat_is_codey=feat_is_codey,
        feat_bucket=feat_bucket,
        feat_has_tools=feat_has_tools,
    )

    # Streaming path — skip cache, log with zero tokens (usage unavailable from SSE)
    if is_streaming:
        _write_log(
            db, **log_kwargs,
            response_data=None, latency_ms=0.0, status_code=200, err_type=None,
        )
        return StreamingResponse(
            provider.forward_stream(
                method=request.method, path=path,
                headers=req_headers, params=params, content=body,
            ),
            media_type="text/event-stream",
        )

    # Cache check — only for POST requests with a JSON body
    key = _cache_key(body) if (request.method == "POST" and isinstance(payload, dict)) else None
    if key:
        cached = _response_cache.get(key)
        if cached is not None:
            _write_log(db, **log_kwargs, response_data=cached, latency_ms=0.0, status_code=200, err_type=None)
            return cached

    t0 = time.perf_counter()
    status, data_or_bytes, resp_headers = await provider.forward(
        method=request.method,
        path=path,
        headers=req_headers,
        params=params,
        content=body,
    )
    latency_ms = (time.perf_counter() - t0) * 1000.0

    err_type = None
    if isinstance(data_or_bytes, dict) and status >= 400:
        err_type = (data_or_bytes.get("error") or {}).get("type")

    _write_log(
        db, **log_kwargs,
        response_data=data_or_bytes if isinstance(data_or_bytes, dict) else None,
        latency_ms=latency_ms,
        status_code=status,
        err_type=err_type,
    )

    if key and status == 200 and isinstance(data_or_bytes, dict):
        _response_cache.set(key, data_or_bytes)

    if isinstance(data_or_bytes, dict):
        return data_or_bytes

    content_type = resp_headers.get("content-type", "application/octet-stream")
    return Response(content=data_or_bytes, status_code=status, media_type=content_type)
