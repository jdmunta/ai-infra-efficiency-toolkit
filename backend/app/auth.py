from datetime import datetime, timedelta

import jwt
from fastapi import Cookie, HTTPException

from .config import settings


def create_session_token(user: dict) -> str:
    payload = {
        "sub": user.get("email", ""),
        "name": user.get("name", ""),
        "picture": user.get("picture", ""),
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_session_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])


def get_current_user(session: str = Cookie(default="")) -> dict:
    # Auth disabled (no Google credentials configured) — return a dev placeholder
    if not settings.GOOGLE_CLIENT_ID:
        return {"sub": "local@localhost", "name": "Local Dev", "picture": ""}
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return decode_session_token(session)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
