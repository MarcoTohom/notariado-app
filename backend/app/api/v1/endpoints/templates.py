"""Repositorio y versionamiento inmutable de plantillas DOCX (Fase 5)."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.schemas.template import (
    PreviewResult,
    TemplateDetail,
    TemplateListResponse,
)
from app.services import template_docx_service as service

router = APIRouter()
DB = Annotated[Session, Depends(get_db)]


@router.get(
    "",
    response_model=TemplateListResponse,
    summary="Listar plantillas DOCX",
)
def list_templates(
    db: DB,
    _: Annotated[User, Depends(require_permission("templates:read"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(default=None),
    case_type: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
) -> TemplateListResponse:
    return service.list_templates(
        db,
        skip=skip,
        limit=limit,
        search=search,
        case_type=case_type,
        status_filter=status_filter,
    )


@router.post(
    "",
    response_model=TemplateDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Cargar plantilla DOCX (crea plantilla y versión v1 en BORRADOR)",
)
async def create_template(
    db: DB,
    current_user: Annotated[User, Depends(require_permission("templates:create"))],
    file: Annotated[UploadFile, File()],
    name: str = Form(min_length=3, max_length=150),
    case_type: str = Form(),
    description: str = Form(default=""),
    notes: str = Form(default=""),
) -> TemplateDetail:
    return await service.create_template_from_docx(
        db,
        name=name,
        case_type=case_type,
        description=description,
        notes=notes or None,
        file=file,
        user=current_user,
    )


@router.get(
    "/{template_id}",
    response_model=TemplateDetail,
    summary="Detalle de plantilla con versiones y campos detectados",
)
def get_template(
    template_id: str,
    db: DB,
    _: Annotated[User, Depends(require_permission("templates:read"))],
) -> TemplateDetail:
    return service.get_template_detail(db, template_id)


@router.post(
    "/{template_id}/versions",
    response_model=TemplateDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Cargar una nueva versión DOCX (nunca sobrescribe las anteriores)",
)
async def upload_version(
    template_id: str,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("templates:update"))],
    file: Annotated[UploadFile, File()],
    notes: str = Form(default=""),
) -> TemplateDetail:
    return await service.add_docx_version(
        db, template_id, file, notes or None, current_user
    )


@router.post(
    "/{template_id}/versions/{version_id}/activate",
    response_model=TemplateDetail,
    summary="Activar versión (deja una única versión vigente por plantilla)",
)
def activate_version(
    template_id: str,
    version_id: str,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("templates:activate"))],
) -> TemplateDetail:
    return service.activate_version(db, template_id, version_id, current_user)


@router.post(
    "/{template_id}/versions/{version_id}/preview",
    response_model=PreviewResult,
    summary="Render de prueba con datos sintéticos y verificación de placeholders",
)
def render_preview(
    template_id: str,
    version_id: str,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("templates:read"))],
) -> PreviewResult:
    return service.render_preview(db, template_id, version_id, current_user)


@router.get(
    "/preview-files/{file_name}",
    summary="Descargar DOCX de prueba generado",
)
def download_preview(
    file_name: str,
    _: Annotated[User, Depends(require_permission("templates:read"))],
) -> FileResponse:
    path = service.preview_file_path(file_name)
    return FileResponse(
        path,
        filename=f"vista_previa_{file_name[:8]}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"X-Content-Type-Options": "nosniff"},
    )


@router.delete(
    "/{template_id}",
    response_model=TemplateDetail,
    summary="Baja lógica de plantilla (el historial de versiones se conserva)",
)
def deactivate_template(
    template_id: str,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("templates:delete"))],
) -> TemplateDetail:
    return service.deactivate_template(db, template_id, current_user)
