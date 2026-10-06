"""Contratos de generación y versionamiento de borradores DOCX (Fase 7)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentVersionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    version_number: int
    template_version_id: str
    template_name: str | None = None
    validation_status: str
    placeholders_free: bool
    residual_variables: list[str] = Field(default_factory=list)
    file_hash: str
    file_size: int
    notes: str | None = None
    created_by_id: str
    download_url: str | None = None
    created_at: datetime


class DocumentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    case_number: str | None = None
    title: str
    status: str
    versions_count: int = 0
    latest_version_id: str | None = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    total: int
    items: list[DocumentSummary]


class DocumentDetail(DocumentSummary):
    versions: list[DocumentVersionInfo] = Field(default_factory=list)


class GenerateDocumentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    case_id: str
    # Si se omite, se usa la versión ACTIVA de la plantilla del tipo de escritura.
    template_version_id: str | None = None
    notes: str | None = Field(default=None, max_length=500)
