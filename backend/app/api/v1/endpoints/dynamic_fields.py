from typing import Annotated

from fastapi import APIRouter, Depends, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.config import settings
from app.db.operations import require_record
from app.db.session import get_db
from app.models.field_attachment import FieldAttachment
from app.models.template import TemplateVersion
from app.models.user import User
from app.schemas.dynamic_field import (
    DefinitionCreate,
    ValidationResult,
    ValuesRequest,
    ValuesResponse,
    VersionCreate,
    VersionResponse,
)
from app.services import dynamic_field_service as service

router = APIRouter()
DB = Annotated[Session, Depends(get_db)]
Read = Annotated[User, Depends(require_permission("templates:read", "cases:read"))]
Write = Annotated[User, Depends(require_permission("templates:read", "cases:update"))]
Configure = Annotated[
    User, Depends(require_permission("templates:create", "templates:update"))
]


@router.get("/versions", response_model=list[VersionResponse])
def list_versions(db: DB, user: Read, case_type: str | None = None):
    versions = (
        db.query(TemplateVersion)
        .order_by(
            TemplateVersion.created_at.desc(), TemplateVersion.version_number.desc()
        )
        .all()
    )
    results = [service.get_version(db, version.id) for version in versions]
    return [v for v in results if case_type is None or v.case_type == case_type]


@router.post("/definitions", response_model=VersionResponse, status_code=201)
def create_definition(payload: DefinitionCreate, db: DB, user: Configure):
    return service.create_version(
        db, payload.fields, user, name=payload.name, case_type=payload.case_type
    )


@router.post(
    "/definitions/{template_id}/versions",
    response_model=VersionResponse,
    status_code=201,
)
def create_version(template_id: str, payload: VersionCreate, db: DB, user: Configure):
    return service.create_version(db, payload.fields, user, template_id=template_id)


@router.get("/versions/{version_id}", response_model=VersionResponse)
def get_version(version_id: str, db: DB, user: Read):
    return service.get_version(db, version_id)


@router.get("/cases/{case_id}/versions/{version_id}", response_model=ValuesResponse)
def get_values(case_id: str, version_id: str, db: DB, user: Read):
    service.case_version(db, case_id, version_id)
    record = service.stored_values(db, case_id, version_id)
    return {
        "values": record.values if record else {},
        "revision": record.revision if record else 0,
        "errors": [],
    }


@router.post(
    "/cases/{case_id}/versions/{version_id}/validate", response_model=ValidationResult
)
def validate_values(
    case_id: str, version_id: str, payload: ValuesRequest, db: DB, user: Read
):
    return service.validate_case_values(db, case_id, version_id, payload.values)


@router.put("/cases/{case_id}/versions/{version_id}", response_model=ValuesResponse)
def save_values(
    case_id: str, version_id: str, payload: ValuesRequest, db: DB, user: Write
):
    return service.save_values(db, case_id, version_id, payload, user)


@router.post("/cases/{case_id}/versions/{version_id}/files", status_code=201)
async def upload_file(
    case_id: str,
    version_id: str,
    file: UploadFile,
    db: DB,
    user: Write,
    field: str = Query(min_length=1, max_length=250),
):
    return await service.upload_file(db, case_id, version_id, field, file, user)


@router.get("/cases/{case_id}/files/{file_id}")
def download_file(case_id: str, file_id: str, db: DB, user: Read):
    from fastapi import HTTPException

    record = require_record(db, FieldAttachment, file_id)
    if record.case_id != case_id:
        raise HTTPException(404, "Archivo no encontrado.")
    path = settings.UPLOAD_DIR / "attachments" / record.storage_name
    if not path.is_file():
        raise HTTPException(404, "Archivo no encontrado.")
    return FileResponse(
        path,
        filename=record.original_name,
        media_type=record.media_type,
        headers={"X-Content-Type-Options": "nosniff"},
    )
