"""Contratos del motor de reglas notariales (Fase 6)."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

Severity = Literal["CRITICAL", "ERROR", "WARNING", "INFO"]


class FindingOut(BaseModel):
    """Hallazgo individual con la estructura estandarizada del skill."""

    rule_id: str
    severity: Severity
    field_key: str
    message: str
    current_value: str = ""
    expected_value: str = ""
    location: str = ""


class RunValidationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    case_id: str
    template_version_id: str
    # Si se envía, se evalúan estos valores en lugar de los almacenados
    # (permite validar antes de guardar el formulario).
    values: dict[str, Any] | None = None


class ValidationSummary(BaseModel):
    status: str
    total: int
    critical: int
    error: int
    warning: int
    info: int


class ValidationRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    template_version_id: str
    executed_by_id: str
    status: str
    total_findings: int
    critical_count: int
    error_count: int
    warning_count: int
    info_count: int
    findings: list[FindingOut]
    created_at: datetime


class ValidationRunListResponse(BaseModel):
    total: int
    items: list[ValidationRunResponse]


class RuleCatalogItem(BaseModel):
    rule_id: str
    severity: str
    name: str
    description: str
