def is_codey(text: str) -> bool:
    t = text or ""
    return ("```" in t) or ("class " in t) or ("def " in t) or ("SELECT " in t.upper())


def len_bucket(n: int) -> str:
    if n <= 300:
        return "0-300"
    if n <= 1200:
        return "300-1200"
    return "1200+"


def detect_has_tools(payload: dict) -> bool:
    if not isinstance(payload, dict):
        return False
    if payload.get("tools"):
        return True
    if payload.get("tool_choice"):
        return True
    msgs = payload.get("messages")
    if isinstance(msgs, list):
        for m in msgs:
            if isinstance(m, dict) and (m.get("tool_calls") or m.get("function_call")):
                return True
    return False
