def choose_model(payload: dict, default_model: str) -> str:
    model = payload.get("model") or default_model

    messages = payload.get("messages") or []
    text = " ".join(
        [m.get("content", "") if isinstance(m, dict) and isinstance(m.get("content"), str) else "" for m in messages]
    )
    is_codey = ("```" in text) or ("class " in text) or ("def " in text) or ("SELECT " in text.upper())

    if not is_codey and len(text) < 1200:
        return "gpt-4o-mini"

    return model
