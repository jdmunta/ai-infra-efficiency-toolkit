from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./data.db"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com"
    DEFAULT_MODEL: str = "gpt-4o-mini"
    APP_ENV: str = "dev"
    STORE_PROMPT_PREVIEW: bool = False

settings = Settings()
