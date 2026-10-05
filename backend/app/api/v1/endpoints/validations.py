"""Motor de validación de consistencia documental notarial (Fase 6)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.rules.engine import rule_catalog_public
from app.schemas.validation import (
    RuleCatalogItem,
    RunValidationRequest,
    ValidationRunListResponse,
    ValidationRunResponse,
)
from app.services import validation_service as service

router = APIRouter()
DB = Annotated[Session, Depends(get_db)]


@router.get(
    "/catalog",
    response_model=list[RuleCatalogItem],
    summary="Catálogo de reglas RULE-001..RULE-020",
)
def get_catalog(
    _: Annotated[User, Depends(require_permission("validations:read"))],
) -> list[dict]:
    return rule_catalog_public()


@router.post(
    "/run",
    response_model=ValidationRunResponse,
    status_code=201,
    summary="Ejecutar el motor de reglas sobre un expediente",
    description=(
        "Evalúa RULE-001..RULE-020 contra los valores almacenados del "
        "expediente (o contra valores enviados en el cuerpo para validar "
        "antes de guardar) y conserva la corrida en el historial."
    ),
)
def run_validation(
    payload: RunValidationRequest,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("validations:execute"))],
) -> ValidationRunResponse:
    return service.execute_validation(
        db,
        payload.case_id,
        payload.template_version_id,
        current_user,
        values_override=payload.values,
    )


@router.get(
    "/cases/{case_id}",
    response_model=ValidationRunListResponse,
    summary="Historial de corridas de validación del expediente",
)
def list_case_runs(
    case_id: str,
    db: DB,
    _: Annotated[User, Depends(require_permission("validations:read"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> ValidationRunListResponse:
    total, items = service.list_runs(db, case_id, skip=skip, limit=limit)
    return ValidationRunListResponse(total=total, items=items)


@router.get(
    "/cases/{case_id}/latest",
    response_model=ValidationRunResponse | None,
    summary="Última corrida de validación del expediente",
)
def get_latest_run(
    case_id: str,
    db: DB,
    _: Annotated[User, Depends(require_permission("validations:read"))],
) -> ValidationRunResponse | None:
    run = service.latest_run(db, case_id)
    return ValidationRunResponse.model_validate(run) if run else None
