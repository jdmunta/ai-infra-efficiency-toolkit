#!/usr/bin/env bash
set -euo pipefail

echo "Starting backend on :8000 and UI on :5173"
echo "Requires: OPENAI_API_KEY set in environment for real forwarding."
echo ""

( cd backend && python -m venv .venv >/dev/null 2>&1 || true
  source backend/.venv/bin/activate
  pip -q install -r backend/requirements.txt
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &

( cd ui
  npm install
  npm run dev -- --host 0.0.0.0 --port 5173
) &

wait
