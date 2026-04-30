from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse

from ..auth import create_session_token, get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/google/login")
def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured on this server")
    params = urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    })
    return RedirectResponse(f"{_GOOGLE_AUTH_URL}?{params}")


@router.get("/google/callback")
async def google_callback(code: str):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501)

    async with httpx.AsyncClient() as client:
        token_r = await client.post(_GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.OAUTH_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        access_token = token_r.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Google token exchange failed")

        user_r = await client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_info = user_r.json()

    session_token = create_session_token(user_info)
    response = RedirectResponse(url=settings.FRONTEND_URL)
    response.set_cookie(
        key="session",
        value=session_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )
    return response


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {
        "email": user.get("sub"),
        "name": user.get("name"),
        "picture": user.get("picture"),
        "auth_enabled": bool(settings.GOOGLE_CLIENT_ID),
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"ok": True}
