#!/usr/bin/env bash
set -euo pipefail
: "${OPENAI_API_KEY:?OPENAI_API_KEY must be set}"

docker compose up --build
