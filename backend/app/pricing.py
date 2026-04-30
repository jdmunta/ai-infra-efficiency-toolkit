# Estimated price per 1M tokens (USD). Keep configurable.
MODEL_PRICING_PER_1M = {
    "gpt-4o": {"input": 5.0, "output": 15.0},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4.1": {"input": 5.0, "output": 15.0},
    "gpt-4.1-mini": {"input": 0.30, "output": 1.20},
}

def estimate_cost_usd(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    p = MODEL_PRICING_PER_1M.get(model)
    if not p:
        return 0.0
    return (prompt_tokens * p["input"] + completion_tokens * p["output"]) / 1_000_000.0
