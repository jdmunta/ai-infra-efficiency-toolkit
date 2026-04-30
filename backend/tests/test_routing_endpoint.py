from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_routing_simulation_endpoint_ok():
    r = client.get("/dashboard/routing?days=1")
    assert r.status_code == 200
    data = r.json()
    assert "totals_usd" in data
    assert "savings_vs_current" in data
    assert "requests_considered" in data
