"""Contracts for the DOCX template repository (Fase 5).

Immutable versioning: each version keeps its own file metadata (hash SHA-256,
original name, size) so a generated draft can always be traced back to the
exact DOCX that produced it.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TemplateFieldInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    label: str
    field_type: str
    required: bool
    docx_variable: str | None = None
    auto_detected: bool = False
    display_order: int = 0


class TemplateVersionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    template_id: str
    version_number: int
    status: str
    has_file: bool = False
    original_filename: str | None = None
    file_hash: str | None = None
    file_size: int | None = None
    notes: str | None = None
    uploaded_by_id: str | None = None
    created_at: datetime
    fields: list[TemplateFieldInfo] = Field(default_factory=list)


class TemplateSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    case_type: str
    description: str | None = None
    status: str
    versions_count: int = 0
    active_version_id: str | None = None
    created_at: datetime
    updated_at: datetime


class TemplateListResponse(BaseModel):
    total: int
    items: list[TemplateSummary]


class TemplateDetail(TemplateSummary):
    versions: list[TemplateVersionInfo] = Field(default_factory=list)


class PreviewResult(BaseModel):
    """Result of a test render (docxtpl) of a template version."""

    file_name: str
    placeholders_free: bool
    residual_variables: list[str]
    download_url: str


# --- Estados de versión DOCX ---
# BORRADOR   -> recién cargada, aún no utilizable para generar borradores.
# ACTIVA     -> única versión vigente por plantilla (US-05.3).
# ARCHIVADA  -> versión histórica de solo lectura, jamás se sobrescribe.
DOCX_VERSION_STATUSES = {"BORRADOR", "ACTIVA", "ARCHIVADA"}
