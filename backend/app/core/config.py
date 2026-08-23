from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SentinelAI"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    FRONTEND_ORIGIN: str = ""
    FRONTEND_ORIGIN_REGEX: str = r"https://.*\.vercel\.app$"


settings = Settings()