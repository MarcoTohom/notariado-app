"""Valores de un expediente asociados a una versión de plantilla."""

from sqlalchemy import JSON, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import IdentifiableMixin


class CaseFieldValues(Base, IdentifiableMixin):
    __tablename__ = "case_field_values"
    __table_args__ = (UniqueConstraint("case_id", "template_version_id"),)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    template_version_id: Mapped[str] = mapped_column(ForeignKey("template_versions.id"))
    values: Mapped[dict] = mapped_column(JSON)
    revision: Mapped[int] = mapped_column(Integer, default=1)
