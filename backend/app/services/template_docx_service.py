"""DOCX template repository (Fase 5, skill `docx-template`).

Flow: carga -> validación -> almacenamiento UUID -> versión inmutable ->
extracción léxica de variables Jinja2 -> registro de campos detectados ->
activación de una única versión vigente -> render de prueba verificado.
"""

import hashlib
import re
from dataclasses import dataclass, field
from pathlib import Path
from uuid import uuid4

from docx import Document
from docxtpl import DocxTemplate
from fastapi import HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.audit import AuditLog
from app.models.dynamic_field import Template, TemplateField, TemplateVersion
from app.models.user import User
from app.schemas.template import (
    PreviewResult,
    TemplateDetail,
    TemplateFieldInfo,
    TemplateListResponse,
    TemplateSummary,
    TemplateVersionInfo,
)
from app.services.dynamic_field_service import flush, verify_file

DOCX_SUFFIX = ".docx"
MAX_TEMPLATE_BYTES = 10 * 1024 * 1024  # 10 MB por archivo (security.md)
VALID_CASE_TYPES = {
    "COMPRAVENTA",
    "DONACION",
    "ARRENDAMIENTO",
    "MATRIMONIO",
    "SOCIEDAD",
}

# --- Patrones léxicos Jinja2 (skill docx-template, paso 2) ---
RE_VARIABLE = re.compile(r"\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}")
RE_LOOP = re.compile(r"\{%\s*for\s+(\w+)\s+in\s+([a-zA-Z0-9_]+)\s*%\}")
RE_CONDITIONAL = re.compile(r"\{%\s*if\s+([a-zA-Z0-9_\.]+)\s*%\}")


@dataclass
class JinjaExtraction:
    """Variables detectadas en el documento, en orden de primera aparición."""

    variables: list[str] = field(default_factory=list)
    loops: list[dict[str, str]] = field(default_factory=list)
    conditionals: list[str] = field(default_factory=list)

    def loop_item_prefixes(self) -> list[str]:
        return [loop["item"] for loop in self.loops]


# ---------------------------------------------------------------------------
# Auditoría y utilidades de archivo
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


def sanitize_original_name(name: str) -> str:
    """Nombre de archivo seguro: basename sin caracteres de control ni rutas."""
    cleaned = re.sub(r"[\x00-\x1f]", "", name.replace("\\", "/").split("/")[-1])
    return cleaned[:200] or "plantilla.docx"


def sha256_hex(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _template_storage_dir() -> Path:
    directory = settings.UPLOAD_DIR / "templates"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _preview_storage_dir() -> Path:
    directory = settings.GENERATED_DIR / "previews"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


async def _read_valid_docx(file: UploadFile) -> tuple[bytes, str]:
    """Valida extensión, tamaño (10 MB) e integridad OpenXML del archivo."""
    original = sanitize_original_name(file.filename or "")
    suffix = Path(original).suffix.lower()
    if suffix != DOCX_SUFFIX:
        raise HTTPException(422, "Solo se permiten archivos con extensión .docx.")
    content = await file.read(MAX_TEMPLATE_BYTES + 1)
    if not content:
        raise HTTPException(422, "El archivo está vacío.")
    if len(content) > MAX_TEMPLATE_BYTES:
        raise HTTPException(413, "El archivo supera el máximo de 10 MB.")
    verify_file(content, DOCX_SUFFIX)  # zip íntegro, sin macros ni XXE
    return content, original


# ---------------------------------------------------------------------------
# Extracción léxica de variables Jinja2 (US-05.2)
# ---------------------------------------------------------------------------


def _iter_document_text(document: Document) -> list[str]:
    """Texto de párrafos y celdas de tablas (incluidas tablas anidadas)."""
    chunks: list[str] = []

    def visit_tables(tables) -> None:
        for table in tables:
            for row in table.rows:
                for cell in row.cells:
                    chunks.extend(p.text for p in cell.paragraphs)
                    visit_tables(cell.tables)

    chunks.extend(p.text for p in document.paragraphs)
    visit_tables(document.tables)
    return chunks


def extract_jinja_variables(path: Path) -> JinjaExtraction:
    """Detecta variables {{ ... }}, bucles {% for %} y condiciones {% if %}."""
    try:
        document = Document(str(path))
    except Exception as exc:
        raise HTTPException(422, "No se pudo abrir el DOCX para su análisis.") from exc

    extraction = JinjaExtraction()
    seen_vars: set[str] = set()
    seen_loops: set[str] = set()
    seen_ifs: set[str] = set()

    for text in _iter_document_text(document):
        for match in RE_VARIABLE.finditer(text):
            var = match.group(1)
            if var not in seen_vars:
                seen_vars.add(var)
                extraction.variables.append(var)
        for match in RE_LOOP.finditer(text):
            item, collection = match.group(1), match.group(2)
            if collection not in seen_loops:
                seen_loops.add(collection)
                extraction.loops.append({"item": item, "collection": collection})
        for match in RE_CONDITIONAL.finditer(text):
            var = match.group(1)
            if var not in seen_ifs:
                seen_ifs.add(var)
                extraction.conditionals.append(var)
    return extraction


def find_residual_variables(path: Path) -> list[str]:
    """Variables {{ ... }} que persisten tras el render (RULE-017)."""
    document = Document(str(path))
    residuals: list[str] = []
    seen: set[str] = set()
    for text in _iter_document_text(document):
        for match in RE_VARIABLE.finditer(text):
            var = match.group(1)
            if var not in seen:
                seen.add(var)
                residuals.append(var)
    return residuals


# ---------------------------------------------------------------------------
# Sugerencia de tipos de campo (US-05.2, mapeo automático)
# ---------------------------------------------------------------------------

_CURRENCY_HINTS = (
    "precio",
    "monto",
    "total",
    "honorario",
    "renta",
    "capital",
    "valor",
    "pago",
    "saldo",
    "deposito",
)
_DATE_HINTS = ("fecha", "vencimiento")
_TEXTAREA_HINTS = ("direccion", "observacion", "descripcion", "clausula", "texto")
_NAME_HINTS = ("nombre", "razon_social", "apellido", "compareciente")


def suggest_field_type(variable: str) -> str:
    """Heurística de tipo según el nombre de la variable Jinja2."""
    name = variable.lower()
    if "dpi" in name or "cui" in name:
        return "dpi"
    if "nit" in name:
        return "nit"
    if "correo" in name or "email" in name:
        return "email"
    if "telefono" in name or "phone" in name:
        return "phone"
    if any(hint in name for hint in _DATE_HINTS):
        return "date"
    if "porcentaje" in name or "percent" in name:
        return "percentage"
    if any(hint in name for hint in _CURRENCY_HINTS):
        return "currency"
    if any(hint in name for hint in _NAME_HINTS):
        return "name"
    if any(hint in name for hint in _TEXTAREA_HINTS):
        return "textarea"
    return "text"


_ACRONYMS = {"dpi", "nit", "cui", "s.a.", "sa"}


def humanize_label(variable: str) -> str:
    """Etiqueta legible: 'comprador.dpi' -> 'Comprador - DPI'."""
    parts = [segment.replace("_", " ").strip() for segment in variable.split(".")]
    humanized: list[str] = []
    for part in parts:
        words = [
            word.upper() if word.lower() in _ACRONYMS else word.capitalize()
            for word in part.split()
            if word
        ]
        humanized.append(" ".join(words))
    return " - ".join(p for p in humanized if p)[:150] or variable[:150]


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

    # 1) Colecciones de bucles como campos tipo lista.
    for loop in extraction.loops:
        db.add(
            TemplateField(
                template_version_id=version_id,
                key=_field_key(loop["collection"], taken),
                label=humanize_label(loop["collection"]),
                field_type="list",
                required=False,
                nullable=True,
                options_json={},
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
    destination = _template_storage_dir() / storage_name
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
    content, original = await _read_valid_docx(file)

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
    content, original = await _read_valid_docx(file)
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

_SAMPLE_BY_TYPE = {
    "dpi": "1234567890101",
    "nit": "1234567-8",
    "name": "Nombre Sintético de Prueba",
    "email": "prueba@example.com",
    "phone": "00000000",
    "date": "1 de enero de 2026",
    "currency": "0.00",
    "percentage": "0",
    "boolean": True,
    "text": "[valor de prueba]",
    "textarea": "[valor de prueba]",
    "list": "[valor de prueba]",
}


def _sample_for(variable: str) -> object:
    return _SAMPLE_BY_TYPE[suggest_field_type(variable)]


def _assign_nested(context: dict, dotted: str, value: object) -> None:
    parts = dotted.split(".")
    node = context
    for part in parts[:-1]:
        existing = node.get(part)
        if not isinstance(existing, dict):
            existing = {}
            node[part] = existing
        node = existing
    node[parts[-1]] = value


def build_sample_context(extraction: JinjaExtraction) -> dict:
    """Contexto sintético para el render de prueba (nunca datos reales)."""
    context: dict = {}
    loop_items = {loop["item"]: loop for loop in extraction.loops}
    collections = {loop["collection"]: loop for loop in extraction.loops}

    for loop in extraction.loops:
        item_vars = [
            var for var in extraction.variables if var.startswith(f"{loop['item']}.")
        ]
        rows = []
        for index in range(2):  # dos elementos de muestra por lista
            row: dict = {}
            for var in item_vars:
                leaf = var.split(".", 1)[1]
                row[leaf] = _sample_for(var)
            row["indice"] = index + 1
            rows.append(row)
        context[loop["collection"]] = rows

    for variable in extraction.variables:
        parts = variable.split(".")
        if parts[0] in collections:
            continue  # ya cubierto por la colección del bucle
        if len(parts) == 1 and variable in loop_items:
            continue  # el item del bucle no existe fuera del for
        _assign_nested(context, variable, _sample_for(variable))

    for variable in extraction.conditionals:
        if variable not in extraction.variables:
            _assign_nested(context, variable, True)
    return context


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
    destination = _preview_storage_dir() / preview_name
    try:
        document = DocxTemplate(str(version.file_path))
        document.render(context)
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
    path = _preview_storage_dir() / file_name
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
