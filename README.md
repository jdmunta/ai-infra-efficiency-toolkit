# AI Infra Efficiency Toolkit

A transparent reverse-proxy gateway for LLM providers with:
- Endpoint-agnostic forwarding (no hardcoded provider paths)
- Request logging (latency, endpoint, model, team)
- Estimated cost from `usage` fields + configurable pricing map
- In-process response cache (LRU, deduplicates identical requests)
- Cache opportunity analysis (duplicate prompt + prefix overlap)
- Model routing with cost simulation
- UI dashboard (Cost, Cache, Routing, Performance)

## Quickstart (Docker)
```bash
export OPENAI_API_KEY="sk-..."
docker compose up --build
```

- Gateway: http://localhost:8000
- Dashboard: http://localhost:5173

## Using the proxy — no code changes required

Set `OPENAI_BASE_URL` before running your existing app. The OpenAI SDK picks it up automatically:

```bash
export OPENAI_BASE_URL=http://localhost:8000
export OPENAI_API_KEY=sk-...
python your_app.py   # all OpenAI calls now route through the gateway
```

Works the same way in Node.js, and any other language whose OpenAI SDK respects `OPENAI_BASE_URL`.

See `examples/` for ready-to-run Python and Node.js clients.

### Tagging requests by team
Add `x-team: <name>` to any request to group cost and usage in the dashboard:
```python
client.chat.completions.create(..., extra_headers={"x-team": "my-team"})
```

### Raw curl
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-team: demo" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'
```

## Dashboard endpoints
| Endpoint | Description |
|---|---|
| `GET /dashboard/summary?days=7` | Total requests, cost, avg latency, error rate |
| `GET /dashboard/timeseries?days=14` | Daily cost, requests, p95 latency |
| `GET /dashboard/cache?days=7` | Duplicate prompt rate, prefix overlap |
| `GET /dashboard/by-team?days=7` | Per-team cost and request breakdown |
| `GET /dashboard/routing?days=7` | Counterfactual cost simulation |
| `GET /dashboard/alerts?days=1` | Budget alerts (requires `TEAM_BUDGETS_JSON`) |
| `GET /health` | Liveness check |

## Configuration
| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | `""` | Server-side key (or pass per-request in Authorization header) |
| `OPENAI_BASE_URL` | `https://api.openai.com` | Upstream provider |
| `DEFAULT_MODEL` | `gpt-4o-mini` | Fallback when no model in request |
| `GATEWAY_API_KEY` | `""` | Require `X-Gateway-Key` on proxy requests when set |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `PRICING_CONFIG_PATH` | `""` | Path to custom pricing JSON file |
| `CACHE_MAX_SIZE` | `500` | Max entries in the response LRU cache |
| `TEAM_BUDGETS_JSON` | `{}` | Daily USD budgets per team, e.g. `'{"default":5.0}'` |
| `STORE_PROMPT_PREVIEW` | `false` | Store first 280 chars of prompt text |

## Dev
```bash
# Backend (http://localhost:8000)
make backend

# Frontend (http://localhost:5173)
make ui

# Tests
make test
```

Backend venv setup (first time):
```bash
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

## SQLite migration (v0.3 → v0.4 existing data)
```bash
sqlite3 backend/data.db < backend/scripts/migrate_sqlite.sql
```

## Notes
- Do NOT expose publicly without setting `GATEWAY_API_KEY`, allowlists, and rate limits.
- Cost is **estimated** from provider `usage` fields. Actual billing may differ.
- Prompt text is never stored unless `STORE_PROMPT_PREVIEW=true`.
- SQLite runs in WAL mode for better concurrent write performance.
