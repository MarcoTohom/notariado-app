"""DOCX template repository (Fase 5, skill `docx-template`).

Flow: carga -> validación -> almacenamiento UUID -> versión inmutable ->
extracción léxica de variables Jinja2 -> registro de campos detectados ->
activación de una única versión vigente -> render de prueba verificado.
"""

import re
from pathlib import Path
from uuid import uuid4

from docxtpl import DocxTemplate
from fastapi import HTTPException, UploadFile
from jinja2 import ChainableUndefined, Environment
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.operations import flush
from app.models.audit import AuditLog
from app.models.dynamic_field import TemplateField
from app.models.template import Template, TemplateVersion
from app.models.user import User
from app.schemas.template import (
    PreviewResult,
    TemplateDetail,
    TemplateFieldInfo,
    TemplateListResponse,
    TemplateSummary,
    TemplateVersionInfo,
)
from app.services.docx.analysis import (
    JinjaExtraction,
    extract_jinja_variables,
    find_residual_variables,
    humanize_label,
    suggest_field_type,
)
from app.services.docx.context import build_sample_context
from app.services.docx.files import (
    DOCX_SUFFIX,
    preview_storage_dir,
    read_valid_docx,
    sha256_hex,
    template_storage_dir,
)

VALID_CASE_TYPES = {
    "COMPRAVENTA",
    "DONACION",
    "ARRENDAMIENTO",
    "MATRIMONIO",
    "SOCIEDAD",
}


# ---------------------------------------------------------------------------
# Auditoría de plantillas
# ---------------------------------------------------------------------------


def _audit(db: Session, user: User, action: str, record_id: str, details: str) -> None:
    db.add(
        AuditLog(
            user_id=user.id,
            user_email=user.email,
            action=action,
            module="PLANTILLAS",
            record_id=record_id,
            status="SUCCESS",
            details=details,
        )
    )


# ---------------------------------------------------------------------------
# Registro de campos detectados (US-05.2)
# ---------------------------------------------------------------------------


def _field_key(variable: str, taken: set[str]) -> str:
    """Clave válida para TemplateField.key: [a-z][a-z0-9_]{0,63}, única por versión."""
    base = re.sub(r"[^a-z0-9_]", "_", variable.lower().replace(".", "_"))
    base = re.sub(r"_+", "_", base).strip("_") or "campo"
    if not base[0].isalpha():
        base = f"v_{base}"
    base = base[:60]
    key, counter = base, 2
    while key in taken:
        key = f"{base}_{counter}"
        counter += 1
    taken.add(key)
    return key


def _register_detected_fields(
    db: Session, version_id: str, extraction: JinjaExtraction
) -> None:
    """Registra en template_fields las variables detectadas (US-05.2)."""
    taken: set[str] = set()
    order = 0
    item_prefixes = tuple(f"{item}." for item in extraction.loop_item_prefixes())

    # 1) Colecciones de bucles como campos tipo lista, con los subcampos
    #    inferidos de las variables del item (comp.nombre -> "nombre").
    #    options_json.fields es obligatorio para el motor de formularios.
    for loop in extraction.loops:
        subfields = []
        sub_taken: set[str] = set()
        for index, variable in enumerate(
            v for v in extraction.variables if v.startswith(f"{loop['item']}.")
        ):
            leaf = variable.split(".", 1)[1]
            subfields.append(
                {
                    "key": _field_key(leaf, sub_taken),
                    "label": humanize_label(leaf),
                    "field_type": suggest_field_type(leaf),
                    "required": False,
                    "nullable": True,
                    "options_json": {},
                    "display_order": index,
                }
            )
        db.add(
            TemplateField(
                template_version_id=version_id,
                key=_field_key(loop["collection"], taken),
                label=humanize_label(loop["collection"]),
                field_type="list",
                required=False,
                nullable=True,
                options_json={"fields": subfields},
                source="manual",
                docx_variable=loop["collection"],
                auto_detected=True,
                display_order=order,
            )
        )
        order += 1

    # 2) Variables simples (las de items de bucle se registran con su ruta).
    for variable in extraction.variables:
        scoped_to_loop = variable.startswith(item_prefixes)
        db.add(
            TemplateField(
                template_version_id=version_id,
                key=_field_key(variable, taken),
                label=humanize_label(variable),
                field_type=suggest_field_type(variable),
                required=False,
                nullable=True,
                options_json={},
                source="manual",
                docx_variable=variable,
                auto_detected=True,
                display_order=order,
                help_text=(
                    f"Variable de la lista «{variable.split('.')[0]}s»."
                    if scoped_to_loop
                    else None
                ),
            )
        )
        order += 1

    # 3) Variables usadas solo en condicionales {% if %}: sugerir booleano.
    simple = set(extraction.variables)
    for variable in extraction.conditionals:
        if variable in simple:
            continue
        db.add(
            TemplateField(
                template_version_id=version_id,
                key=_field_key(variable, taken),
                label=humanize_label(variable),
                field_type="boolean",
                required=False,
                nullable=True,
                options_json={},
                source="manual",
                docx_variable=variable,
                auto_detected=True,
                display_order=order,
            )
        )
        order += 1


# ---------------------------------------------------------------------------
# Ingesta y versionamiento inmutable (US-05.1 y US-05.3)
# ---------------------------------------------------------------------------


def _build_version(
    db: Session,
    template: Template,
    user: User,
    content: bytes,
    original: str,
    notes: str | None,
) -> TemplateVersion:
    number = (
        db.query(func.max(TemplateVersion.version_number))
        .filter_by(template_id=template.id)
        .scalar()
        or 0
    ) + 1
    storage_name = f"{uuid4()}{DOCX_SUFFIX}"
    destination = template_storage_dir() / storage_name
    version = TemplateVersion(
        template_id=template.id,
        version_number=number,
        status="BORRADOR",
        file_path=str(destination),
        original_filename=original,
        file_hash=sha256_hex(content),
        file_size=len(content),
        notes=notes,
        uploaded_by_id=user.id,
    )
    try:
        destination.write_bytes(content)
        db.add(version)
        flush(db)
        extraction = extract_jinja_variables(destination)
        _register_detected_fields(db, version.id, extraction)
        _audit(
            db,
            user,
            "CREATE_VERSION",
            version.id,
            f"Versión v{number} de «{template.name}» con {len(extraction.variables)} variables detectadas.",
        )
        db.commit()
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise
    return version


async def create_template_from_docx(
    db: Session,
    *,
    name: str,
    case_type: str,
    description: str | None,
    notes: str | None,
    file: UploadFile,
    user: User,
) -> TemplateDetail:
    if case_type not in VALID_CASE_TYPES:
        raise HTTPException(422, f"Tipo de escritura inválido: {case_type}.")
    clean_name = name.strip()
    if len(clean_name) < 3:
        raise HTTPException(422, "El nombre debe tener al menos 3 caracteres.")
    content, original = await read_valid_docx(file)

    template = Template(
        name=clean_name,
        case_type=case_type,
        description=(description or "").strip() or None,
        status="ACTIVE",
    )
    try:
        db.add(template)
        flush(db)
    except Exception:
        db.rollback()
        raise
    _build_version(db, template, user, content, original, notes)
    _audit(
        db, user, "CREATE_TEMPLATE", template.id, f"Plantilla «{clean_name}» creada."
    )
    db.commit()
    return get_template_detail(db, template.id)


async def add_docx_version(
    db: Session,
    template_id: str,
    file: UploadFile,
    notes: str | None,
    user: User,
) -> TemplateDetail:
    template = db.get(Template, template_id)
    if template is None or template.status != "ACTIVE":
        raise HTTPException(404, "Plantilla no encontrada o inactiva.")
    content, original = await read_valid_docx(file)
    _build_version(db, template, user, content, original, notes)
    return get_template_detail(db, template.id)


def activate_version(
    db: Session, template_id: str, version_id: str, user: User
) -> TemplateDetail:
    """Una única versión DOCX ACTIVA por plantilla; las demás quedan ARCHIVADAS.

    Las versiones jamás se sobrescriben: activar solo mueve el puntero de
    vigencia y el historial permanece intacto en solo lectura.
    """
    template = db.get(Template, template_id)
    if template is None or template.status != "ACTIVE":
        raise HTTPException(404, "Plantilla no encontrada o inactiva.")
    target = db.get(TemplateVersion, version_id)
    if target is None or target.template_id != template_id:
        raise HTTPException(404, "Versión no encontrada en esta plantilla.")
    if not target.file_path:
        raise HTTPException(
            422, "Solo se pueden activar versiones con archivo DOCX cargado."
        )

    docx_versions = [
        v
        for v in db.query(TemplateVersion).filter_by(template_id=template_id).all()
        if v.file_path
    ]
    for version in docx_versions:
        version.status = "ACTIVA" if version.id == version_id else "ARCHIVADA"
    _audit(
        db,
        user,
        "ACTIVATE_VERSION",
        version_id,
        f"Versión v{target.version_number} activada en «{template.name}».",
    )
    db.commit()
    return get_template_detail(db, template_id)


def deactivate_template(db: Session, template_id: str, user: User) -> TemplateDetail:
    template = db.get(Template, template_id)
    if template is None:
        raise HTTPException(404, "Plantilla no encontrada.")
    template.status = "INACTIVE"
    _audit(
        db,
        user,
        "DELETE_LOGICAL",
        template.id,
        f"Plantilla «{template.name}» dada de baja (historial conservado).",
    )
    db.commit()
    return get_template_detail(db, template_id)


# ---------------------------------------------------------------------------
# Render de prueba con verificación (skill docx-template, paso 3)
# ---------------------------------------------------------------------------


def render_preview(
    db: Session, template_id: str, version_id: str, user: User
) -> PreviewResult:
    """Render docxtpl con datos sintéticos y verificación de cero placeholders."""
    template = db.get(Template, template_id)
    if template is None:
        raise HTTPException(404, "Plantilla no encontrada.")
    version = db.get(TemplateVersion, version_id)
    if version is None or version.template_id != template_id:
        raise HTTPException(404, "Versión no encontrada en esta plantilla.")
    if not version.file_path or not Path(version.file_path).is_file():
        raise HTTPException(422, "La versión no tiene un archivo DOCX disponible.")

    extraction = extract_jinja_variables(Path(version.file_path))
    context = build_sample_context(extraction)
    preview_name = f"{uuid4()}.docx"
    destination = preview_storage_dir() / preview_name
    jinja_env = Environment(undefined=ChainableUndefined, autoescape=False)
    try:
        document = DocxTemplate(str(version.file_path))
        document.render(context, jinja_env=jinja_env)
        document.save(str(destination))
    except HTTPException:
        raise
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            422,
            "La plantilla no pudo renderizarse; revise la sintaxis Jinja2 "
            "(bucles {% for %} y condicionales {% if %} deben cerrarse).",
        ) from exc

    residuals = find_residual_variables(destination)
    _audit(
        db,
        user,
        "GENERATE_PREVIEW",
        version.id,
        f"Render de prueba v{version.version_number}: "
        f"{'sin' if not residuals else 'con'} placeholders residuales.",
    )
    db.commit()
    return PreviewResult(
        file_name=preview_name,
        placeholders_free=not residuals,
        residual_variables=residuals,
        download_url=f"/api/v1/templates/preview-files/{preview_name}",
    )


def preview_file_path(file_name: str) -> Path:
    """Ruta segura de un preview generado (anti path-traversal)."""
    if not re.fullmatch(r"[0-9a-f-]{36}\.docx", file_name):
        raise HTTPException(404, "Archivo no encontrado.")
    path = preview_storage_dir() / file_name
    if not path.is_file():
        raise HTTPException(404, "Archivo no encontrado o expirado.")
    return path


# ---------------------------------------------------------------------------
# Consultas
# ---------------------------------------------------------------------------


def _version_info(db: Session, version: TemplateVersion) -> TemplateVersionInfo:
    fields = (
        db.query(TemplateField)
        .filter_by(template_version_id=version.id)
        .order_by(TemplateField.display_order, TemplateField.key)
        .all()
    )
    return TemplateVersionInfo(
        id=version.id,
        template_id=version.template_id,
        version_number=version.version_number,
        status=version.status,
        has_file=bool(version.file_path),
        original_filename=version.original_filename,
        file_hash=version.file_hash,
        file_size=version.file_size,
        notes=version.notes,
        uploaded_by_id=version.uploaded_by_id,
        created_at=version.created_at,
        fields=[TemplateFieldInfo.model_validate(row) for row in fields],
    )


def get_template_detail(db: Session, template_id: str) -> TemplateDetail:
    template = db.get(Template, template_id)
    if template is None:
        raise HTTPException(404, "Plantilla no encontrada.")
    versions = (
        db.query(TemplateVersion)
        .filter_by(template_id=template_id)
        .order_by(TemplateVersion.version_number.desc())
        .all()
    )
    active = next((v for v in versions if v.status == "ACTIVA"), None)
    return TemplateDetail(
        id=template.id,
        name=template.name,
        case_type=template.case_type,
        description=template.description,
        status=template.status,
        versions_count=len(versions),
        active_version_id=active.id if active else None,
        created_at=template.created_at,
        updated_at=template.updated_at,
        versions=[_version_info(db, version) for version in versions],
    )


def list_templates(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
    case_type: str | None = None,
    status_filter: str | None = None,
) -> TemplateListResponse:
    query = db.query(Template)
    if search:
        fmt = f"%{search.strip()}%"
        query = query.filter(Template.name.ilike(fmt) | Template.description.ilike(fmt))
    if case_type:
        query = query.filter(Template.case_type == case_type)
    if status_filter:
        query = query.filter(Template.status == status_filter)

    total = query.count()
    templates = (
        query.order_by(Template.created_at.desc()).offset(skip).limit(limit).all()
    )
    items: list[TemplateSummary] = []
    for template in templates:
        versions = db.query(TemplateVersion).filter_by(template_id=template.id).all()
        active = next((v for v in versions if v.status == "ACTIVA"), None)
        items.append(
            TemplateSummary(
                id=template.id,
                name=template.name,
                case_type=template.case_type,
                description=template.description,
                status=template.status,
                versions_count=len(versions),
                active_version_id=active.id if active else None,
                created_at=template.created_at,
                updated_at=template.updated_at,
            )
        )
    return TemplateListResponse(total=total, items=items)
