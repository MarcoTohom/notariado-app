from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.health import HealthResponse, SystemInfo

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Verificación de salud del sistema",
    description="Retorna el estado de disponibilidad del backend y conectividad con SQLite.",
)
def check_health(db: Annotated[Session, Depends(get_db)]) -> HealthResponse:
    # Check database connectivity
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        db_status = f"unhealthy: {exc!s}"

    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        app=settings.PROJECT_NAME,
        system=SystemInfo(
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            debug=settings.DEBUG,
            database="sqlite",
            timestamp=datetime.now(timezone.utc),
        ),
        checks={
            "database": db_status,
            "uploads_dir": settings.UPLOAD_DIR.exists(),
            "generated_dir": settings.GENERATED_DIR.exists(),
        },
    )
