from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SentinelAI"
    VERSION: str = "1.0.0"
    DEBUG: bool = True


settings = Settings()