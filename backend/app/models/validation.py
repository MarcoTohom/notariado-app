"""Persistencia de las corridas del motor de reglas (Fase 6).

Cada corrida conserva su resultado completo en JSON para trazabilidad:
qué regla falló, con qué valor actual y qué valor esperado.
"""

from sqlalchemy import JSON, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import IdentifiableMixin


class ValidationRun(Base, IdentifiableMixin):
    __tablename__ = "validation_runs"

    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id"), nullable=False, index=True
    )
    template_version_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("template_versions.id"), nullable=False
    )
    executed_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    # LIMPIO | CON_ADVERTENCIAS | CON_INCONSISTENCIAS
    status: Mapped[str] = mapped_column(String(25), nullable=False)
    total_findings: Mapped[int] = mapped_column(Integer, default=0)
    critical_count: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    warning_count: Mapped[int] = mapped_column(Integer, default=0)
    info_count: Mapped[int] = mapped_column(Integer, default=0)
    findings: Mapped[list] = mapped_column(JSON, default=list)
