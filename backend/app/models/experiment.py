"""Módulo de medición científica de tesis (Fase 11).

test_cases: corpus de 100 casos sintéticos estratificados (20 por tipo de
escritura; 50% con anomalías deliberadas y hallazgos esperados registrados).
test_executions: corridas de revisión por método (TRADITIONAL vs SYSTEM).
time_measurements: duración por etapa dentro de cada corrida.
"""

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import IdentifiableMixin


class TestCase(Base, IdentifiableMixin):
    __tablename__ = "test_cases"

    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id"), nullable=False, index=True
    )
    template_version_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("template_versions.id"), nullable=False
    )
    case_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    has_anomalies: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    # Tipos de anomalía inyectada y reglas que DEBERÍAN dispararse.
    anomaly_types: Mapped[list] = mapped_column(JSON, default=list)
    expected_findings: Mapped[list] = mapped_column(JSON, default=list)


class TestExecution(Base, IdentifiableMixin):
    __tablename__ = "test_executions"

    test_case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("test_cases.id"), nullable=False, index=True
    )
    method: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # TRADITIONAL | SYSTEM
    started_at: Mapped[str] = mapped_column(String(40), nullable=False)
    finished_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_minutes: Mapped[str | None] = mapped_column(String(20), nullable=True)
    errors_found: Mapped[int] = mapped_column(Integer, default=0)
    errors_missed: Mapped[int] = mapped_column(Integer, default=0)
    corrections: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )


class TimeMeasurement(Base, IdentifiableMixin):
    __tablename__ = "time_measurements"

    execution_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("test_executions.id"), nullable=False, index=True
    )
    # DETECCION | CORRECCION | GENERACION
    stage: Mapped[str] = mapped_column(String(20), nullable=False)
    started_at: Mapped[str] = mapped_column(String(40), nullable=False)
    finished_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
