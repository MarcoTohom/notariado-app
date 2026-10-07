"""Módulo de medición experimental de tesis UMG (Fase 11)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.experiment import TestCase
from app.models.user import User
from app.schemas.experiment import (
    CorpusGenerationResult,
    FinishExecutionRequest,
    StartExecutionRequest,
    StartStageRequest,
    TestCaseListResponse,
    TestExecutionOut,
    TimeMeasurementOut,
)
from app.services import experiment_service as service

router = APIRouter()
DB = Annotated[Session, Depends(get_db)]


@router.post(
    "/cases/generate",
    response_model=CorpusGenerationResult,
    status_code=status.HTTP_201_CREATED,
    summary="Generar el corpus de 100 casos sintéticos estratificados",
)
def generate_corpus(
    db: DB,
    current_user: Annotated[User, Depends(require_permission("experiment:execute"))],
) -> CorpusGenerationResult:
    distribution = service.generate_corpus(db, current_user)
    total = sum(v["total"] for v in distribution.values())
    anomalous = sum(v["anomalous"] for v in distribution.values())
    return CorpusGenerationResult(
        distribution=distribution, total=total, anomalous=anomalous
    )


@router.get(
    "/cases",
    response_model=TestCaseListResponse,
    summary="Listar el corpus de casos de prueba",
)
def list_cases(
    db: DB,
    _: Annotated[User, Depends(require_permission("experiment:read"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    case_type: str | None = Query(default=None),
    has_anomalies: bool | None = Query(default=None),
) -> TestCaseListResponse:
    query = db.query(TestCase)
    if case_type:
        query = query.filter(TestCase.case_type == case_type)
    if has_anomalies is not None:
        query = query.filter(TestCase.has_anomalies == has_anomalies)
    total = query.count()
    items = (
        query.order_by(TestCase.case_type, TestCase.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return TestCaseListResponse(total=total, items=items)


@router.post(
    "/executions/start",
    response_model=TestExecutionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Iniciar una corrida de medición cronometrada",
)
def start_execution(
    payload: StartExecutionRequest,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("experiment:execute"))],
) -> TestExecutionOut:
    return service.start_execution(
        db, payload.test_case_id, payload.method, current_user
    )


@router.post(
    "/executions/{execution_id}/finish",
    response_model=TestExecutionOut,
    summary="Finalizar la corrida y registrar duración y errores",
)
def finish_execution(
    execution_id: str,
    payload: FinishExecutionRequest,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("experiment:execute"))],
) -> TestExecutionOut:
    return service.finish_execution(
        db,
        execution_id,
        current_user,
        payload.errors_found,
        payload.errors_missed,
        payload.corrections,
        payload.notes,
    )


@router.post(
    "/executions/{execution_id}/stages/start",
    response_model=TimeMeasurementOut,
    status_code=status.HTTP_201_CREATED,
    summary="Iniciar el cronómetro de una etapa (detección/corrección/generación)",
)
def start_stage(
    execution_id: str,
    payload: StartStageRequest,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("experiment:execute"))],
) -> TimeMeasurementOut:
    return service.start_stage(db, execution_id, payload.stage, current_user)


@router.post(
    "/stages/{measurement_id}/finish",
    response_model=TimeMeasurementOut,
    summary="Finalizar el cronómetro de una etapa",
)
def finish_stage(
    measurement_id: str,
    db: DB,
    current_user: Annotated[User, Depends(require_permission("experiment:execute"))],
) -> TimeMeasurementOut:
    return service.finish_stage(db, measurement_id, current_user)


@router.get(
    "/stats",
    summary="Estadística experimental calculada desde las corridas reales",
)
def get_stats(
    db: DB,
    _: Annotated[User, Depends(require_permission("experiment:read"))],
) -> dict:
    return service.compute_stats(db)


@router.get(
    "/export.xlsx",
    summary="Exportar ejecuciones y resumen a Excel (Capítulo IV)",
)
def export_xlsx(
    db: DB,
    _: Annotated[User, Depends(require_permission("experiment:read"))],
) -> Response:
    content = service.export_xlsx(db)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="experimento_tesis.xlsx"',
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get(
    "/export.csv",
    summary="Exportar ejecuciones a CSV (Capítulo IV)",
)
def export_csv(
    db: DB,
    _: Annotated[User, Depends(require_permission("experiment:read"))],
) -> Response:
    content = service.export_csv(db)
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="experimento_tesis.csv"',
            "X-Content-Type-Options": "nosniff",
        },
    )
