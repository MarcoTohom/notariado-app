"""Generación, historial y descarga de borradores DOCX (Fase 7)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.schemas.document import (
    DocumentDetail,
    DocumentListResponse,
    GenerateDocumentRequest,
)
from app.services import document_generation_service as service

router = APIRouter()
DB = Annotated[Session, Depends(get_db)]


@router.post(
    "/generate",
    response_model=DocumentDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Generar borrador DOCX verificado (docxtpl + cero placeholders)",
    description=(
        "Renderiza la plantilla ACTIVA (o la versión indicada) con los datos "
        "del expediente. Requiere cero hallazgos CRITICAL del motor de reglas "
        "y verifica que no queden variables {{ ... }} residuales."
    ),
)
def generate_document(
    payload: GenerateDocumentRequest,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("documents:generate"))],
) -> DocumentDetail:
    return service.generate_draft(
        db, payload.case_id, payload.template_version_id, payload.notes, current_user
    )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="Listar documentos generados",
)
def list_documents(
    db: DB,
    _: Annotated[User, Depends(require_permission("documents:read"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    case_id: str | None = Query(default=None),
    doc_status: str | None = Query(default=None, alias="status"),
) -> DocumentListResponse:
    return service.list_documents(
        db, skip=skip, limit=limit, case_id=case_id, status=doc_status
    )


@router.get(
    "/{document_id}",
    response_model=DocumentDetail,
    summary="Detalle de documento con historial de versiones",
)
def get_document(
    document_id: str,
    db: DB,
    _: Annotated[User, Depends(require_permission("documents:read"))],
) -> DocumentDetail:
    return service.get_document_detail(db, document_id)


@router.get(
    "/versions/{version_id}/download",
    summary="Descargar versión de borrador (autenticada)",
)
def download_version(
    version_id: str,
    db: DB,
    _: Annotated[User, Depends(require_permission("documents:read"))],
) -> FileResponse:
    path, version = service.version_file_path(db, version_id)
    return FileResponse(
        path,
        filename=f"borrador_v{version.version_number}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"X-Content-Type-Options": "nosniff"},
    )
