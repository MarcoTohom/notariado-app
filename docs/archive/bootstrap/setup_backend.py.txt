import os

base = r"C:\git\apps\notariado-app\backend\app"

files = {}

files["__init__.py"] = '''"""Sistema de Borradores de Escrituras Públicas - Backend."""
__version__ = "1.0.0"
'''

files["core/__init__.py"] = '''"""Core application settings and utilities."""
'''

files["core/config.py"] = '''from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

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
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./app.db"

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
        extra="ignore"
    )

settings = Settings()
'''

files["db/__init__.py"] = '''"""Database connectivity and models registry."""
from app.db.base import Base
from app.db.session import engine, SessionLocal, get_db

__all__ = ["Base", "engine", "SessionLocal", "get_db"]
'''

files["db/base.py"] = '''from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func

class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy models."""
    pass

class TimestampMixin:
    """Mixin for models that track creation and update timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
'''

files["db/session.py"] = '''from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db() -> Generator[Session, None, None]:
    """Dependency that yields an active database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'''

files["models/__init__.py"] = '''"""ORM Models package."""
'''

files["models/base.py"] = '''import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from app.db.base import Base, TimestampMixin

class IdentifiableMixin(TimestampMixin):
    """Mixin providing UUID string primary keys and timestamps."""
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
'''

files["schemas/__init__.py"] = '''"""Pydantic data schemas package."""
from app.schemas.health import HealthResponse, SystemInfo

__all__ = ["HealthResponse", "SystemInfo"]
'''

files["schemas/health.py"] = '''from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime

class SystemInfo(BaseModel):
    version: str
    environment: str
    debug: bool
    database: str
    timestamp: datetime

class HealthResponse(BaseModel):
    status: str
    app: str
    system: SystemInfo
    checks: Dict[str, Any]
'''

files["api/__init__.py"] = '''"""API Package."""
'''

files["api/v1/__init__.py"] = '''"""API v1 Package."""
'''

files["api/v1/endpoints/__init__.py"] = '''"""API v1 Endpoints Package."""
'''

files["api/v1/endpoints/health.py"] = '''from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.config import settings
from app.schemas.health import HealthResponse, SystemInfo

router = APIRouter()

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Verificación de salud del sistema",
    description="Retorna el estado de disponibilidad del backend y conectividad con SQLite."
)
def check_health(db: Session = Depends(get_db)) -> HealthResponse:
    # Check database connectivity
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        app=settings.PROJECT_NAME,
        system=SystemInfo(
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            debug=settings.DEBUG,
            database="sqlite",
            timestamp=datetime.now(timezone.utc)
        ),
        checks={
            "database": db_status,
            "uploads_dir": settings.UPLOAD_DIR.exists(),
            "generated_dir": settings.GENERATED_DIR.exists(),
        }
    )
'''

files["api/v1/api.py"] = '''from fastapi import APIRouter
from app.api.v1.endpoints import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["Salud del Sistema"])
'''

files["services/__init__.py"] = '''"""Business logic services."""
'''

files["rules/__init__.py"] = '''"""Notarial rule engine package."""
'''

files["repositories/__init__.py"] = '''"""Data access repositories."""
'''

files["utils/__init__.py"] = '''"""Utility functions, seeders and helpers."""
'''

files["main.py"] = '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    (settings.UPLOAD_DIR / "templates").mkdir(parents=True, exist_ok=True)
    (settings.UPLOAD_DIR / "imports").mkdir(parents=True, exist_ok=True)
    (settings.UPLOAD_DIR / "attachments").mkdir(parents=True, exist_ok=True)
    
    # Create tables if not present
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown actions

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema de Borradores de Escrituras Públicas y Validación Documental Notarial (UMG)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
'''

for rel_path, content in files.items():
    full_path = os.path.join(base, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {rel_path}")

print("All backend base modules created successfully.")
