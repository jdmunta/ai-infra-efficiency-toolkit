.PHONY: help backend ui test docker-up docker-down format

help:
	@echo "Targets:"
	@echo "  backend        Run backend locally"
	@echo "  ui             Run UI locally"
	@echo "  test           Run backend tests"
	@echo "  docker-up      Start with docker compose"
	@echo "  docker-down    Stop docker compose"

backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

ui:
	cd ui && npm install && npm run dev -- --host 0.0.0.0 --port 5173

test:
	cd backend && pytest -q

docker-up:
	docker compose up --build

docker-down:
	docker compose down -v
