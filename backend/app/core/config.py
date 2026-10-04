from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema de Borradores de Escrituras Públicas"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database: Always resolve to backend/app.db
    DATABASE_URL: str = ""

    @model_validator(mode="after")
    def resolve_database_url(self):
        # Guarantee absolute path to backend/app.db to prevent CWD confusion
        db_path = BASE_DIR / "app.db"
        if not self.DATABASE_URL or "./app.db" in self.DATABASE_URL:
            # Use forward slashes for SQLite URI
            self.DATABASE_URL = f"sqlite:///{db_path.as_posix()}"
        return self

    # Security (JWT & Password Hashing)
    SECRET_KEY: str = "dev_secret_key_antigravity_notariado_guatemala_2026_umg"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Storage paths
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    GENERATED_DIR: Path = BASE_DIR / "generated"

    # Thesis experimental parameters
    DEFAULT_BASELINE_MINUTES: int = 240
    TARGET_MINUTES: int = 60
    TOTAL_SYNTHETIC_CASES: int = 100

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
