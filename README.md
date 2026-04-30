# AI Infra Efficiency Toolkit (MVP)

A transparent reverse-proxy gateway for LLM providers with:
- Endpoint-agnostic forwarding (no hardcoded provider paths)
- Request logging (latency, endpoint, model best-effort)
- Estimated cost (best-effort from `usage` fields + configurable pricing map)
- Cache opportunity analysis (duplicate prompt + prefix overlap)
- Simple UI dashboard (Cost, Cache, placeholders for Routing/Performance)

## Quickstart (Docker)
```bash
export OPENAI_API_KEY="YOUR_KEY"
docker compose up --build
```

- Gateway API: http://localhost:8000
- UI Dashboard: http://localhost:5173

## Using the proxy
Point your SDK base URL to the gateway, then call any provider-supported path. Example:
```bash
curl "http://localhost:8000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "x-team: demo" \
  -d '{
    "model":"gpt-4o",
    "messages":[{"role":"user","content":"Hello!"}]
  }'
```

## Internal endpoints
- `GET /dashboard/summary?days=7`
- `GET /dashboard/timeseries?days=14`
- `GET /dashboard/cache?days=7`
- `GET /dashboard/routing?days=7` (routing simulation)
- `GET /health`

## Dev (Backend)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Dev (UI)
```bash
cd ui
npm install
npm run dev
```

## Tests
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

## Notes
- This MVP is a reverse proxy. Do NOT expose it publicly without adding authentication, allowlists, rate-limits, and secret handling.
- Cost is **estimated** based on provider `usage` fields and a configurable pricing map.


## v0.4 notes (privacy-safe routing features)
This version stores minimal routing features per request:
- `is_codey` (boolean)
- `prompt_len_bucket` (0-300 / 300-1200 / 1200+)
- `has_tools` (boolean, best-effort)

### SQLite migration
If you want to keep existing data, run:
```bash
sqlite3 backend/data.db < backend/scripts/migrate_sqlite.sql
```

### Prompt preview storage
By default, prompt previews are NOT stored. To enable:
```bash
export STORE_PROMPT_PREVIEW=true
```
