from ..pricing import estimate_cost_usd

def compute_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    return estimate_cost_usd(model, prompt_tokens, completion_tokens)
