"""Inventario y previsualización de archivos gestionados (WP-05)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.services import file_inventory_service as service

router = APIRouter()
DB = Annotated[Session, Depends(get_db)]


@router.get(
    "/inventory",
    summary="Inventario de archivos con verificación de persistencia",
    description=(
        "Lista los archivos gestionados (plantillas, adjuntos, borradores y "
        "renders de prueba) verificando existencia en disco, tamaño y hash "
        "contra su registro en base de datos."
    ),
)
def get_inventory(
    db: DB,
    _: Annotated[User, Depends(require_permission("files:read"))],
    kind: str | None = Query(default=None),
    file_status: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> dict:
    rows = service.build_inventory(db, kind, file_status)
    return {"total": len(rows), "items": rows[skip : skip + limit]}


@router.get(
    "/preview/{kind}/{record_id}",
    summary="Previsualizar contenido del archivo en modal (sin descarga)",
)
def get_preview(
    kind: str,
    record_id: str,
    db: DB,
    _: Annotated[User, Depends(require_permission("files:read"))],
) -> dict:
    return service.preview_file(db, kind.upper(), record_id)
