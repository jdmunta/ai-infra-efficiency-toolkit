import httpx
from ..config import settings

class OpenAIProvider:
    def __init__(self):
        self.base_url = settings.OPENAI_BASE_URL.rstrip("/")
        self.api_key = settings.OPENAI_API_KEY

    async def forward(self, method: str, path: str, *, headers: dict, params: dict, content: bytes):
        url = f"{self.base_url}/{path.lstrip('/')}"
        fwd_headers = {"Authorization": f"Bearer {self.api_key}"}

        for h in ("content-type", "accept"):
            if h in headers:
                fwd_headers[h] = headers[h]

        timeout = httpx.Timeout(120.0, connect=10.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.request(
                method=method,
                url=url,
                headers=fwd_headers,
                params=params,
                content=content,
            )

            resp_ct = r.headers.get("content-type", "")
            if "application/json" in resp_ct:
                try:
                    return r.status_code, r.json(), dict(r.headers)
                except Exception:
                    return r.status_code, {"error": {"message": "Non-JSON response"}}, dict(r.headers)

            return r.status_code, r.content, dict(r.headers)
