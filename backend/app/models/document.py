"""Borradores generados y su versionamiento inmutable (Fase 7).

Un Document agrupa las versiones de borrador de un expediente; cada
DocumentVersion congela el archivo DOCX, el hash SHA-256, el snapshot de
datos usado y el resultado de la verificación de placeholders (RULE-017).
"""

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import IdentifiableMixin


class Document(Base, IdentifiableMixin):
    __tablename__ = "documents"

    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    # BORRADOR | AUTORIZADO | ANULADO
    status: Mapped[str] = mapped_column(String(20), default="BORRADOR", index=True)


class DocumentVersion(Base, IdentifiableMixin):
    __tablename__ = "document_versions"

    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    template_version_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("template_versions.id"), nullable=False
    )
    # Snapshot de los valores utilizados: permite reconstruir qué datos
    # produjeron exactamente esta versión (reproducibilidad jurídica).
    data_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    # OK | ERROR_PLACEHOLDERS_PENDIENTES
    validation_status: Mapped[str] = mapped_column(String(40), default="OK")
    placeholders_free: Mapped[bool] = mapped_column(Boolean, default=True)
    residual_variables: Mapped[list] = mapped_column(JSON, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
