from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogListResponse

router = APIRouter()


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="Consultar bitácora de auditoría",
    description="Retorna eventos de auditoría registrados en el sistema. Requiere permiso 'audit:read'.",
)
def list_audit_logs(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("audit:read"))],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    action: Annotated[str | None, Query(description="Filtrar por acción")] = None,
    module: Annotated[str | None, Query(description="Filtrar por módulo")] = None,
    status_filter: Annotated[
        str | None, Query(alias="status", description="Filtrar por estado")
    ] = None,
    user_email: Annotated[
        str | None, Query(description="Filtrar por correo del usuario")
    ] = None,
) -> AuditLogListResponse:
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if module:
        query = query.filter(AuditLog.module == module)
    if status_filter:
        query = query.filter(AuditLog.status == status_filter)
    if user_email:
        query = query.filter(AuditLog.user_email.ilike(f"%{user_email.strip()}%"))

    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return AuditLogListResponse(total=total, items=items)
