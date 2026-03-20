from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    POSTGRES_USER: str = "skillforge"
    POSTGRES_PASSWORD: str = "skillforge123"
    POSTGRES_DB: str = "skillforge"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    SECRET_KEY: str = "change-me-32-char-random-string!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: str = ""

    VITE_API_URL: str = "http://localhost:8000"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"


settings = Settings()