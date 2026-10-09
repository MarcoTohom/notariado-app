"""Plantillas y versiones; conserva las tablas y metadatos existentes."""

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import IdentifiableMixin


class Template(Base, IdentifiableMixin):
    __tablename__ = "templates"
    name: Mapped[str] = mapped_column(String(150))
    case_type: Mapped[str] = mapped_column(String(30))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")


class TemplateVersion(Base, IdentifiableMixin):
    __tablename__ = "template_versions"
    __table_args__ = (UniqueConstraint("template_id", "version_number"),)
    template_id: Mapped[str] = mapped_column(ForeignKey("templates.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), default="FIELD_DEFINITION")
    # --- Metadatos de archivo DOCX (Fase 5; nulos en versiones JSON de Fase 4) ---
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(200), nullable=True)
    file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
