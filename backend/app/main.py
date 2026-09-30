from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
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
    lifespan=lifespan,
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
        "health": f"{settings.API_V1_STR}/health",
    }
