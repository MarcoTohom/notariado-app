"""Field definitions are immutable per template version; values belong to cases."""

from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import IdentifiableMixin


class Template(Base, IdentifiableMixin):
    __tablename__ = "templates"
    name: Mapped[str] = mapped_column(String(150))
    case_type: Mapped[str] = mapped_column(String(30))


class TemplateVersion(Base, IdentifiableMixin):
    __tablename__ = "template_versions"
    __table_args__ = (UniqueConstraint("template_id", "version_number"),)
    template_id: Mapped[str] = mapped_column(ForeignKey("templates.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), default="FIELD_DEFINITION")


class TemplateField(Base, IdentifiableMixin):
    __tablename__ = "template_fields"
    __table_args__ = (UniqueConstraint("template_version_id", "key"),)
    template_version_id: Mapped[str] = mapped_column(
        ForeignKey("template_versions.id"), index=True
    )
    key: Mapped[str] = mapped_column(String(64))
    label: Mapped[str] = mapped_column(String(150))
    field_type: Mapped[str] = mapped_column(String(20))
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    nullable: Mapped[bool] = mapped_column(Boolean, default=True)
    default_value: Mapped[Any | None] = mapped_column(JSON, nullable=True)
    min_length: Mapped[int | None] = mapped_column(Integer)
    max_length: Mapped[int | None] = mapped_column(Integer)
    min_value: Mapped[str | None] = mapped_column(String(64))
    max_value: Mapped[str | None] = mapped_column(String(64))
    regex: Mapped[str | None] = mapped_column(String(200))
    mask: Mapped[str | None] = mapped_column(String(80))
    format: Mapped[str | None] = mapped_column(String(80))
    options_json: Mapped[dict] = mapped_column(JSON)
    source: Mapped[str] = mapped_column(String(20))
    source_reference: Mapped[str | None] = mapped_column(String(64))
    readonly: Mapped[bool] = mapped_column(Boolean, default=False)
    calculated: Mapped[bool] = mapped_column(Boolean, default=False)
    calculation_expression: Mapped[str | None] = mapped_column(String(500))
    docx_variable: Mapped[str | None] = mapped_column(String(150))
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    help_text: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class CaseFieldValues(Base, IdentifiableMixin):
    __tablename__ = "case_field_values"
    __table_args__ = (UniqueConstraint("case_id", "template_version_id"),)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    template_version_id: Mapped[str] = mapped_column(ForeignKey("template_versions.id"))
    values: Mapped[dict] = mapped_column(JSON)
    revision: Mapped[int] = mapped_column(Integer, default=1)


class FieldAttachment(Base, IdentifiableMixin):
    __tablename__ = "field_attachments"
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    template_version_id: Mapped[str] = mapped_column(ForeignKey("template_versions.id"))
    field_key: Mapped[str] = mapped_column(String(250))
    original_name: Mapped[str] = mapped_column(String(200))
    storage_name: Mapped[str] = mapped_column(String(50), unique=True)
    media_type: Mapped[str] = mapped_column(String(150))
    size: Mapped[int] = mapped_column(Integer)
