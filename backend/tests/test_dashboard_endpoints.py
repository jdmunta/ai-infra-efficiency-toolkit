from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_dashboard_summary_empty_ok():
    r = client.get("/dashboard/summary?days=1")
    assert r.status_code == 200
    data = r.json()
    assert "total_requests" in data
    assert "total_cost_usd" in data
