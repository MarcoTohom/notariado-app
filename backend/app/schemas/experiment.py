"""Contratos del módulo de medición experimental de tesis (Fase 11)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TestCaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    template_version_id: str
    case_type: str
    title: str
    has_anomalies: bool
    anomaly_types: list[str]
    expected_findings: list[str]
    created_at: datetime


class TestCaseListResponse(BaseModel):
    total: int
    items: list[TestCaseOut]


class CorpusGenerationResult(BaseModel):
    distribution: dict[str, dict[str, int]]
    total: int
    anomalous: int


class StartExecutionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    test_case_id: str
    method: str = Field(pattern="^(TRADITIONAL|SYSTEM)$")


class FinishExecutionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Solo para método TRADITIONAL (SYSTEM los computa automáticamente).
    errors_found: int | None = Field(default=None, ge=0)
    errors_missed: int | None = Field(default=None, ge=0)
    corrections: int = Field(default=0, ge=0)
    notes: str | None = Field(default=None, max_length=500)


class TestExecutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    test_case_id: str
    method: str
    started_at: str
    finished_at: str | None
    duration_seconds: int | None
    duration_minutes: str | None
    errors_found: int
    errors_missed: int
    corrections: int
    notes: str | None
    executed_by_id: str
    created_at: datetime


class TimeMeasurementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    execution_id: str
    stage: str
    started_at: str
    finished_at: str | None
    duration_seconds: int | None


class StartStageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: str = Field(pattern="^(DETECCION|CORRECCION|GENERACION)$")
