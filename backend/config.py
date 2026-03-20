from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    POSTGRES_USER:     str = "skillforge"
    POSTGRES_PASSWORD: str = "skillforge123"
    POSTGRES_DB:       str = "skillforge"
    POSTGRES_HOST:     str = "localhost"
    POSTGRES_PORT:     int = 5432

    # Auth
    SECRET_KEY:                  str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # LLM
    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: str = ""

    # HuggingFace cache
    HF_HOME: str = "./.hf_cache"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()