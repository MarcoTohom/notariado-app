"""Metadatos de adjuntos vinculados a campos y expedientes."""

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import IdentifiableMixin


class FieldAttachment(Base, IdentifiableMixin):
    __tablename__ = "field_attachments"
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    template_version_id: Mapped[str] = mapped_column(ForeignKey("template_versions.id"))
    field_key: Mapped[str] = mapped_column(String(250))
    original_name: Mapped[str] = mapped_column(String(200))
    storage_name: Mapped[str] = mapped_column(String(50), unique=True)
    media_type: Mapped[str] = mapped_column(String(150))
    size: Mapped[int] = mapped_column(Integer)
