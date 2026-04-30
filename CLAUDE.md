# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A reverse-proxy gateway for LLM providers (OpenAI-compatible API) that transparently logs every request, estimates cost, detects caching opportunities, and simulates alternative routing policies. The gateway sits between callers and the provider — callers point their SDK base URL at `http://localhost:8000` and use it normally.

## Commands

### Backend
```bash
# Dev server (from repo root)
make backend
# or directly:
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Run all tests
make test
# or: cd backend && pytest -q

# Run a single test file
cd backend && pytest tests/test_routing.py -q

# Run a single test by name
cd backend && pytest tests/test_cost.py::test_estimate_cost_known_model -q
```

### Frontend
```bash
make ui
# or: cd ui && npm install && npm run dev
```

### Docker (full stack)
```bash
export OPENAI_API_KEY="..."
make docker-up    # docker compose up --build
make docker-down  # docker compose down -v
```

### SQLite migration (v0.3 → v0.4 existing data)
```bash
sqlite3 backend/data.db < backend/scripts/migrate_sqlite.sql
```

## Architecture

### Request flow

Every non-internal HTTP request hits the catch-all route in `backend/app/main.py:proxy_any`. The flow is:

1. Parse JSON body → extract prompt text
2. `routing/policy.py:choose_model()` — may downgrade model to `gpt-4o-mini` for short, non-codey prompts
3. `providers/openai_provider.py:OpenAIProvider.forward()` — async httpx forward to `OPENAI_BASE_URL`
4. Parse response `usage` fields → `analytics/cost.py:compute_cost()` → estimated USD
5. Compute `prompt_hash` (SHA-256) and `prompt_prefix_hash` (first 200 chars) for cache analysis
6. Write a `RequestLog` row to SQLite
7. Return provider response to caller

Internal paths (`/dashboard`, `/health`, `/admin`) are blocked from proxying.

### Key modules

| Path | Role |
|---|---|
| `backend/app/main.py` | FastAPI app + catch-all proxy route + request logging |
| `backend/app/providers/openai_provider.py` | httpx forwarding; strips all headers except `content-type`, `accept`, `authorization` |
| `backend/app/routing/policy.py` | Model routing heuristic: non-codey + short → `gpt-4o-mini` |
| `backend/app/analytics/cache.py` | SHA-256 hashing + k-shingle similarity for cache analysis |
| `backend/app/pricing.py` | Per-model pricing table (`MODEL_PRICING_PER_1M`); add models here |
| `backend/app/api/dashboard.py` | `/dashboard/*` endpoints; includes routing simulation across 3 policies |
| `backend/app/models.py` | SQLAlchemy `RequestLog` ORM model (single table, SQLite) |
| `backend/app/schemas.py` | Pydantic response schemas for dashboard endpoints |
| `backend/app/config.py` | `Settings` via pydantic-settings |
| `ui/src/api.ts` | All frontend → backend API calls |
| `ui/src/pages/` | Dashboard pages: Cost, Cache, Routing, Performance |

### Privacy-safe feature storage

The gateway intentionally stores minimal, non-reversible request features:
- `prompt_hash` / `prompt_prefix_hash` — SHA-256, not reversible
- `is_codey` — boolean heuristic (code backticks / class / def / SELECT)
- `prompt_len_bucket` — coarse bucket: `0-300`, `300-1200`, `1200+`
- `has_tools` — boolean

Prompt text is only stored if `STORE_PROMPT_PREVIEW=true`.

### Routing simulation (`/dashboard/routing`)

The routing endpoint runs three counterfactual simulations over logged requests using stored token counts and features:
- **current**: actual model used
- **all_mini**: force `gpt-4o-mini` for everything
- **heuristic**: apply `_heuristic_model_from_features()` using stored `is_codey` + `prompt_len_bucket`

### Configuration (environment variables)

| Variable | Default | Notes |
|---|---|---|
| `OPENAI_API_KEY` | `""` | Required for proxying |
| `OPENAI_BASE_URL` | `https://api.openai.com` | Override for Azure / local proxies |
| `DEFAULT_MODEL` | `gpt-4o-mini` | Fallback when no model in request |
| `DATABASE_URL` | `sqlite:///./data.db` | SQLite path relative to `backend/` |
| `STORE_PROMPT_PREVIEW` | `false` | Set `true` to store first 280 chars of prompt |

### Adding a new model's pricing

Edit `backend/app/pricing.py` — add an entry to `MODEL_PRICING_PER_1M` with `input` and `output` keys (USD per 1M tokens).

### Adding a new provider

Create `backend/app/providers/<name>_provider.py` implementing an async `forward(method, path, *, headers, params, content)` method returning `(status_code, data_or_bytes, resp_headers)`. Wire it into `backend/app/main.py`.
