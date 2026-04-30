from ..utils import is_codey


def choose_model(payload: dict, default_model: str) -> str:
    model = payload.get("model") or default_model

    messages = payload.get("messages") or []
    text = " ".join(
        m.get("content", "")
        if isinstance(m, dict) and isinstance(m.get("content"), str)
        else ""
        for m in messages
    )

    if not is_codey(text) and len(text) < 1200:
        return "gpt-4o-mini"

    return model
