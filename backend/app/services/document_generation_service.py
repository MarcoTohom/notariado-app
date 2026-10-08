"""DocumentGenerationService (Fase 7): render docxtpl auditado y versionado.

Flujo: cargar plantilla -> cargar datos del expediente -> validar contexto
(motor de reglas: sin hallazgos CRITICAL) -> renderizar -> generar DOCX ->
verificar cero placeholders con python-docx -> guardar archivo + versión.
"""

from pathlib import Path
from uuid import uuid4

from docxtpl import DocxTemplate
from fastapi import HTTPException
from jinja2 import ChainableUndefined, Environment
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.audit import AuditLog
from app.models.case import Case
from app.models.document import Document, DocumentVersion
from app.models.dynamic_field import (
    CaseFieldValues,
    Template,
    TemplateField,
    TemplateVersion,
)
from app.models.user import User
from app.rules.engine import run_rules, summarize
from app.schemas.document import (
    DocumentDetail,
    DocumentListResponse,
    DocumentSummary,
    DocumentVersionInfo,
)
from app.services.dynamic_field_service import flush
from app.services.template_docx_service import (
    _assign_nested,
    find_residual_variables,
    sha256_hex,
)
from app.services.validation_service import _build_context

# ---------------------------------------------------------------------------
# Construcción del contexto Jinja2 desde los valores del formulario
# ---------------------------------------------------------------------------


def _xml_safe(value):
    """Escapa XML en cadenas: docxtpl inyecta valores CRUDOS en document.xml
    y un `<` rompería la estructura del DOCX (y abriría una vía de inyección).
    El escape aquí se revierte al parsear: el texto final es idéntico al original.
    """
    from xml.sax.saxutils import escape as xml_escape

    if isinstance(value, str):
        return xml_escape(value)
    if isinstance(value, list):
        return [_xml_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: _xml_safe(item) for key, item in value.items()}
    return value


def build_render_context(fields: list[TemplateField], values: dict) -> dict:
    """Mapea los valores planos del formulario a las variables Jinja2.

    - Variables planas se copian tal cual (compatibilidad con claves directas).
    - Los valores None se omiten: Jinja2 los imprimiría como texto "None".
    - `docx_variable` con punto (comprador.dpi) anida en diccionarios.
    - Campos lista (testigos) pasan como colecciones de filas para {% for %}.
    """
    context: dict = {
        key: _xml_safe(value) for key, value in values.items() if value is not None
    }
    for field in fields:
        if not field.docx_variable:
            continue
        value = values.get(field.key)
        if value is None:
            continue
        variable = field.docx_variable
        if field.field_type == "list":
            context[variable] = _xml_safe(value) if isinstance(value, list) else []
        elif "." in variable:
            _assign_nested(context, variable, _xml_safe(value))
        else:
            context[variable] = _xml_safe(value)
    return context


# ---------------------------------------------------------------------------
# Resolución de plantilla y bloqueo por hallazgos críticos
# ---------------------------------------------------------------------------


def _resolve_template_version(
    db: Session, case: Case, template_version_id: str | None
) -> TemplateVersion:
    if template_version_id:
        version = db.get(TemplateVersion, template_version_id)
        if version is None:
            raise HTTPException(404, "Versión de plantilla no encontrada.")
        template = db.get(Template, version.template_id)
        if template and template.case_type != case.case_type:
            raise HTTPException(
                422,
                "La plantilla no corresponde al tipo de escritura del expediente.",
            )
    else:
        version = (
            db.query(TemplateVersion)
            .join(Template, Template.id == TemplateVersion.template_id)
            .filter(
                Template.case_type == case.case_type,
                Template.status == "ACTIVE",
                TemplateVersion.status == "ACTIVA",
            )
            .order_by(TemplateVersion.version_number.desc())
            .first()
        )
        if version is None:
            raise HTTPException(
                422,
                "No hay una versión de plantilla ACTIVA para este tipo de escritura. "
                "Cargue y active una en el módulo Plantillas.",
            )
    if not version.file_path or not Path(version.file_path).is_file():
        raise HTTPException(422, "La versión de plantilla no tiene un archivo DOCX.")
    return version


def _load_stored_values(db: Session, case_id: str, version_id: str) -> dict:
    stored = (
        db.query(CaseFieldValues)
        .filter_by(case_id=case_id, template_version_id=version_id)
        .first()
    )
    if stored is None:
        raise HTTPException(
            422,
            "El expediente no tiene datos capturados para esta plantilla. "
            "Complete el formulario dinámico antes de generar el borrador.",
        )
    return stored.values


def _enforce_no_critical_findings(
    db: Session, case_id: str, version_id: str, values: dict
) -> None:
    """El botón Generar DOCX exige cero hallazgos CRITICAL (spec §39)."""
    ctx = _build_context(db, case_id, version_id, values)
    findings = run_rules(ctx)
    critical = [f for f in findings if f.severity == "CRITICAL"]
    if critical:
        raise HTTPException(
            422,
            detail={
                "message": "Existen inconsistencias CRÍTICAS. Corríjalas antes de generar el borrador.",
                "critical_findings": [f.to_dict() for f in critical],
                "summary": summarize(findings),
            },
        )


# ---------------------------------------------------------------------------
# Generación, verificación y versionamiento (US-07.1 y US-07.2)
# ---------------------------------------------------------------------------


def _document_storage_dir() -> Path:
    directory = settings.GENERATED_DIR / "documents"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def generate_draft(
    db: Session,
    case_id: str,
    template_version_id: str | None,
    notes: str | None,
    user: User,
) -> DocumentDetail:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(404, "Expediente no encontrado.")
    if case.status in {"CANCELADO", "FINALIZADO"}:
        raise HTTPException(409, "El expediente está cerrado.")

    version = _resolve_template_version(db, case, template_version_id)
    values = _load_stored_values(db, case.id, version.id)
    _enforce_no_critical_findings(db, case.id, version.id, values)

    fields = db.query(TemplateField).filter_by(template_version_id=version.id).all()
    context = build_render_context(fields, values)

    # Render docxtpl estrictamente en backend (US-07.1).
    # ChainableUndefined: los datos parciales (p. ej. un vendedor no cargado)
    # renderizan vacío en lugar de abortar; RULE-001 ya vigila lo obligatorio.
    jinja_env = Environment(undefined=ChainableUndefined, autoescape=False)
    storage_name = f"{uuid4()}.docx"
    destination = _document_storage_dir() / storage_name
    try:
        document = DocxTemplate(str(version.file_path))
        document.render(context, jinja_env=jinja_env)
        document.save(str(destination))
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            422, "La plantilla no pudo renderizarse con los datos del expediente."
        ) from exc

    # Verificación post-generación de cero placeholders (US-07.2).
    residuals = find_residual_variables(destination)
    placeholders_free = not residuals
    content = destination.read_bytes()

    # Agrupar versiones por expediente + plantilla (historial inmutable).
    template = db.get(Template, version.template_id)
    document_row = (
        db.query(Document)
        .filter_by(case_id=case.id, title=f"Borrador — {template.name}")
        .first()
    )
    try:
        if document_row is None:
            document_row = Document(
                case_id=case.id,
                title=f"Borrador — {template.name}",
                status="BORRADOR",
            )
            db.add(document_row)
            flush(db)
        number = (
            db.query(func.max(DocumentVersion.version_number))
            .filter_by(document_id=document_row.id)
            .scalar()
            or 0
        ) + 1
        doc_version = DocumentVersion(
            document_id=document_row.id,
            version_number=number,
            template_version_id=version.id,
            data_snapshot={
                "case_id": case.id,
                "template_version_id": version.id,
                "values": values,
            },
            file_path=str(destination),
            file_hash=sha256_hex(content),
            file_size=len(content),
            validation_status=(
                "OK" if placeholders_free else "ERROR_PLACEHOLDERS_PENDIENTES"
            ),
            placeholders_free=placeholders_free,
            residual_variables=residuals,
            notes=notes,
            created_by_id=user.id,
        )
        db.add(doc_version)
        flush(db)
        db.add(
            AuditLog(
                user_id=user.id,
                user_email=user.email,
                action="GENERATE_DOCUMENT",
                module="DOCUMENTOS",
                record_id=doc_version.id,
                status="SUCCESS" if placeholders_free else "WARNING",
                details=(
                    f"Borrador v{number} generado para {case.case_number}: "
                    f"{'sin' if placeholders_free else 'CON'} placeholders residuales "
                    f"({len(residuals)})."
                ),
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise
    return get_document_detail(db, document_row.id)


# ---------------------------------------------------------------------------
# Consultas y descarga (US-07.3)
# ---------------------------------------------------------------------------


def _version_info(db: Session, version: DocumentVersion) -> DocumentVersionInfo:
    template_version = db.get(TemplateVersion, version.template_version_id)
    template = (
        db.get(Template, template_version.template_id) if template_version else None
    )
    return DocumentVersionInfo(
        id=version.id,
        document_id=version.document_id,
        version_number=version.version_number,
        template_version_id=version.template_version_id,
        template_name=template.name if template else None,
        validation_status=version.validation_status,
        placeholders_free=version.placeholders_free,
        residual_variables=version.residual_variables or [],
        file_hash=version.file_hash,
        file_size=version.file_size,
        notes=version.notes,
        created_by_id=version.created_by_id,
        download_url=f"/api/v1/documents/versions/{version.id}/download",
        created_at=version.created_at,
    )


def get_document_detail(db: Session, document_id: str) -> DocumentDetail:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(404, "Documento no encontrado.")
    case = db.get(Case, document.case_id)
    versions = (
        db.query(DocumentVersion)
        .filter_by(document_id=document_id)
        .order_by(DocumentVersion.version_number.desc())
        .all()
    )
    return DocumentDetail(
        id=document.id,
        case_id=document.case_id,
        case_number=case.case_number if case else None,
        title=document.title,
        status=document.status,
        versions_count=len(versions),
        latest_version_id=versions[0].id if versions else None,
        created_at=document.created_at,
        updated_at=document.updated_at,
        versions=[_version_info(db, v) for v in versions],
    )


def list_documents(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    case_id: str | None = None,
    status: str | None = None,
) -> DocumentListResponse:
    query = db.query(Document)
    if case_id:
        query = query.filter(Document.case_id == case_id)
    if status:
        query = query.filter(Document.status == status)
    total = query.count()
    documents = (
        query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    )
    items: list[DocumentSummary] = []
    for document in documents:
        case = db.get(Case, document.case_id)
        latest = (
            db.query(DocumentVersion)
            .filter_by(document_id=document.id)
            .order_by(DocumentVersion.version_number.desc())
            .first()
        )
        count = db.query(DocumentVersion).filter_by(document_id=document.id).count()
        items.append(
            DocumentSummary(
                id=document.id,
                case_id=document.case_id,
                case_number=case.case_number if case else None,
                title=document.title,
                status=document.status,
                versions_count=count,
                latest_version_id=latest.id if latest else None,
                created_at=document.created_at,
                updated_at=document.updated_at,
            )
        )
    return DocumentListResponse(total=total, items=items)


def version_file_path(db: Session, version_id: str) -> tuple[Path, DocumentVersion]:
    version = db.get(DocumentVersion, version_id)
    if version is None:
        raise HTTPException(404, "Versión de documento no encontrada.")
    path = Path(version.file_path)
    if not path.is_file():
        raise HTTPException(404, "El archivo del borrador no existe en disco.")
    return path, version


# ---------------------------------------------------------------------------
# Preview en vivo para el editor de borradores (WP-07)
# ---------------------------------------------------------------------------


def _docx_to_html(document) -> str:
    """HTML simple y escapado (anti-XSS) del documento renderizado."""
    from html import escape

    parts: list[str] = []
    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if text:
            parts.append(f"<p>{escape(text)}</p>")
    for table in document.tables:
        parts.append("<table><tbody>")
        for row in table.rows:
            cells = "".join(
                f"<td>{escape(cell.text.strip())}</td>" for cell in row.cells
            )
            parts.append(f"<tr>{cells}</tr>")
        parts.append("</tbody></table>")
    return "".join(parts) or "<p>(documento vacío)</p>"


def render_preview_html(
    db: Session, case_id: str, template_version_id: str, values: dict
) -> dict:
    """Render en memoria (sin persistir) para la previsualización del editor.

    Devuelve HTML escapado del documento y la verificación de placeholders
    residuales, con el mismo motor de contexto de la generación real.
    """
    import io

    from docx import Document

    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(404, "Expediente no encontrado.")
    version = db.get(TemplateVersion, template_version_id)
    if version is None:
        raise HTTPException(404, "Versión de plantilla no encontrada.")
    template = db.get(Template, version.template_id)
    if template and template.case_type != case.case_type:
        raise HTTPException(
            422, "La plantilla no corresponde al tipo de escritura del expediente."
        )
    if not version.file_path or not Path(version.file_path).is_file():
        raise HTTPException(422, "La versión de plantilla no tiene un archivo DOCX.")

    fields = db.query(TemplateField).filter_by(template_version_id=version.id).all()
    context = build_render_context(fields, values)
    jinja_env = Environment(undefined=ChainableUndefined, autoescape=False)
    buffer = io.BytesIO()
    try:
        document = DocxTemplate(str(version.file_path))
        document.render(context, jinja_env=jinja_env)
        document.save(buffer)
    except Exception as exc:
        raise HTTPException(
            422, "La plantilla no pudo renderizarse con los datos enviados."
        ) from exc

    buffer.seek(0)
    rendered = Document(buffer)
    residuals = _residuals_in_document(rendered)
    return {
        "html": _docx_to_html(rendered),
        "placeholders_free": not residuals,
        "residual_variables": residuals,
    }


def _residuals_in_document(document) -> list[str]:
    """Variables {{ ... }} residuales en un documento ya abierto (RULE-017)."""
    from app.services.template_docx_service import RE_VARIABLE

    texts = [p.text for p in document.paragraphs]
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                texts.extend(p.text for p in cell.paragraphs)
    residuals: list[str] = []
    seen: set[str] = set()
    for text in texts:
        for match in RE_VARIABLE.finditer(text):
            if match.group(1) not in seen:
                seen.add(match.group(1))
                residuals.append(match.group(1))
    return residuals
