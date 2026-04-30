import json
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./data.db"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com"
    DEFAULT_MODEL: str = "gpt-4o-mini"
    APP_ENV: str = "dev"
    STORE_PROMPT_PREVIEW: bool = False

    # Auth: set to a non-empty string to require X-Gateway-Key on proxy requests
    GATEWAY_API_KEY: str = ""

    # CORS: comma-separated list of allowed origins
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Path to a JSON file with per-model pricing (same structure as MODEL_PRICING_PER_1M)
    PRICING_CONFIG_PATH: str = ""

    # Max entries in the in-process response LRU cache
    CACHE_MAX_SIZE: int = 500

    # JSON object mapping team name -> daily budget in USD, e.g. '{"default": 5.0}'
    TEAM_BUDGETS_JSON: str = "{}"

    @property
    def team_budgets(self) -> dict:
        try:
            return json.loads(self.TEAM_BUDGETS_JSON)
        except Exception:
            return {}


settings = Settings()
