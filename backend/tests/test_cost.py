from app.pricing import estimate_cost_usd

def test_estimate_cost_known_model():
    c = estimate_cost_usd("gpt-4o-mini", 1000, 500)
    assert c > 0
    # input: 0.15 per 1M => 0.00015, output: 0.60 per 1M => 0.00030
    assert abs(c - (1000*0.15 + 500*0.60)/1_000_000) < 1e-12

def test_estimate_cost_unknown_model():
    assert estimate_cost_usd("unknown-model", 1000, 500) == 0.0
