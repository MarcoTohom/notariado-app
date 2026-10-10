import re
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import func, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.operations import commit, flush, require_record
from app.models.audit import AuditLog
from app.models.case import Case
from app.models.case_field_values import CaseFieldValues
from app.models.client import Client
from app.models.dynamic_field import TemplateField
from app.models.field_attachment import FieldAttachment
from app.models.template import Template, TemplateVersion
from app.schemas.dynamic_field import FieldDefinition, VersionResponse
from app.services.field_validation import check_definitions, validate_values
from app.services.file_validation import MIME_TYPES, verify_file


def audit(db, user, action, record_id):
    db.add(
        AuditLog(
            user_id=user.id,
            user_email=user.email,
            action=action,
            module="CAMPOS_DINAMICOS",
            record_id=record_id,
            status="SUCCESS",
            details="Operación de campos dinámicos; valores omitidos por privacidad.",
        )
    )


def get_version(db: Session, version_id: str) -> VersionResponse:
    version = require_record(db, TemplateVersion, version_id)
    template = require_record(db, Template, version.template_id)
    rows = (
        db.query(TemplateField)
        .filter_by(template_version_id=version_id)
        .order_by(TemplateField.display_order, TemplateField.key)
        .all()
    )
    return VersionResponse(
        id=version.id,
        template_id=template.id,
        version_number=version.version_number,
        name=template.name,
        case_type=template.case_type,
        fields=[FieldDefinition.model_validate(row) for row in rows],
    )


def create_version(db, fields, user, *, template_id=None, name=None, case_type=None):
    try:
        check_definitions(fields)
    except (ValueError, ArithmeticError) as exc:
        raise HTTPException(422, str(exc)) from exc
    if template_id:
        template = require_record(db, Template, template_id)
        number = (
            db.query(func.max(TemplateVersion.version_number))
            .filter_by(template_id=template.id)
            .scalar()
            or 0
        ) + 1
    else:
        template = Template(name=name.strip(), case_type=case_type)
        db.add(template)
        flush(db)
        number = 1
    version = TemplateVersion(template_id=template.id, version_number=number)
    db.add(version)
    flush(db)
    for field in fields:
        db.add(
            TemplateField(
                template_version_id=version.id, **field.model_dump(mode="json")
            )
        )
    audit(db, user, "CREATE_VERSION", version.id)
    commit(db)
    return get_version(db, version.id)


def case_version(db, case_id, version_id):
    case = require_record(db, Case, case_id)
    definition = get_version(db, version_id)
    if case.case_type != definition.case_type:
        raise HTTPException(422, "El formulario no corresponde al tipo de expediente.")
    return case, definition


def stored_values(db, case_id, version_id):
    return (
        db.query(CaseFieldValues)
        .filter_by(case_id=case_id, template_version_id=version_id)
        .first()
    )


def relation_lookup(db, source, value):
    if not isinstance(value, str) or len(value) != 36:
        raise ValueError("Seleccione un registro relacionado válido.")
    model = Client if source == "clients" else Case
    record = db.get(model, value)
    if record is None or source == "clients" and record.status != "ACTIVE":
        raise ValueError("Registro relacionado inexistente o inactivo.")
    return record


def canonical_path(path):
    return ".".join(p for p in path.split(".") if not p.isdigit())


def attachment_lookup(db, case_id, version_id, value, path, field):
    record = db.get(FieldAttachment, value)
    if (
        record is None
        or record.case_id != case_id
        or record.template_version_id != version_id
        or record.field_key != canonical_path(path)
    ):
        raise ValueError("El archivo no pertenece a este campo y expediente.")
    if (
        record.size > field.options_json.max_bytes
        or Path(record.original_name).suffix.lower()
        not in field.options_json.extensions
    ):
        raise ValueError("El archivo no cumple las restricciones del campo.")
    return record


def validate_case_values(db, case_id, version_id, supplied):
    _, definition = case_version(db, case_id, version_id)
    old = stored_values(db, case_id, version_id)
    return validate_values(
        definition.fields,
        supplied,
        previous=old.values if old else {},
        relation=lambda source, value: relation_lookup(db, source, value),
        attachment=lambda value, path, field: attachment_lookup(
            db, case_id, version_id, value, path, field
        ),
    )


def save_values(db, case_id, version_id, payload, user):
    case, _ = case_version(db, case_id, version_id)
    if case.status in {"CANCELADO", "FINALIZADO"}:
        raise HTTPException(409, "El expediente está cerrado.")
    result = validate_case_values(db, case_id, version_id, payload.values)
    if result.errors:
        raise HTTPException(422, {"errors": [e.model_dump() for e in result.errors]})
    old = stored_values(db, case_id, version_id)
    if old:
        changed = db.execute(
            update(CaseFieldValues)
            .where(
                CaseFieldValues.id == old.id,
                CaseFieldValues.revision == payload.revision,
            )
            .values(values=result.values, revision=payload.revision + 1)
        )
        if changed.rowcount != 1:
            db.rollback()
            raise HTTPException(
                409, "Otra persona modificó el formulario. Recargue los datos."
            )
        record_id = old.id
    else:
        if payload.revision != 0:
            raise HTTPException(409, "Recargue el formulario antes de guardar.")
        old = CaseFieldValues(
            case_id=case_id,
            template_version_id=version_id,
            values=result.values,
            revision=1,
        )
        db.add(old)
        flush(db)
        record_id = old.id
    audit(db, user, "SAVE_VALUES", record_id)
    commit(db)
    return {**result.model_dump(), "revision": payload.revision + 1}


def field_at_path(fields, path):
    parts = canonical_path(path).split(".")
    for i, key in enumerate(parts):
        field = next((f for f in fields if f.key == key and f.active), None)
        if field is None:
            raise HTTPException(404, "Campo no encontrado.")
        if i == len(parts) - 1:
            return field
        if field.field_type != "list":
            raise HTTPException(404, "Campo no encontrado.")
        fields = field.options_json.fields
    raise HTTPException(404, "Campo no encontrado.")


async def upload_file(db, case_id, version_id, path, file: UploadFile, user):
    case, definition = case_version(db, case_id, version_id)
    if case.status in {"CANCELADO", "FINALIZADO"}:
        raise HTTPException(409, "El expediente está cerrado.")
    field = field_at_path(definition.fields, path)
    if field.field_type != "file" or field.readonly:
        raise HTTPException(422, "El campo no permite cargar archivos.")
    original = re.sub(
        r"[\x00-\x1f]", "", (file.filename or "").replace("\\", "/").split("/")[-1]
    )[:200]
    suffix = Path(original).suffix.lower()
    if suffix not in field.options_json.extensions or suffix not in MIME_TYPES:
        raise HTTPException(422, "Extensión de archivo no permitida.")
    if file.content_type not in {
        MIME_TYPES[suffix],
        "application/octet-stream",
        "application/vnd.ms-excel" if suffix == ".csv" else MIME_TYPES[suffix],
    }:
        raise HTTPException(422, "Tipo de archivo no permitido.")
    content = await file.read(field.options_json.max_bytes + 1)
    if not content or len(content) > field.options_json.max_bytes:
        raise HTTPException(413, "Archivo vacío o demasiado grande.")
    verify_file(content, suffix)
    storage_name = f"{uuid4()}{suffix}"
    directory = settings.UPLOAD_DIR / "attachments"
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / storage_name
    record = FieldAttachment(
        case_id=case_id,
        template_version_id=version_id,
        field_key=canonical_path(path),
        original_name=original,
        storage_name=storage_name,
        media_type=MIME_TYPES[suffix],
        size=len(content),
    )
    try:
        destination.write_bytes(content)
        db.add(record)
        flush(db)
        audit(db, user, "UPLOAD_ATTACHMENT", record.id)
        commit(db)
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise
    return {"id": record.id, "name": record.original_name, "size": record.size}
