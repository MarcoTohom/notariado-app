from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.schemas.case import (
    AddPartyRequest,
    CaseCreate,
    CaseListResponse,
    CasePartyResponse,
    CaseResponse,
    CaseUpdate,
)
from app.services.case_service import (
    add_party_to_case,
    create_case,
    delete_case_logical,
    get_case_by_id,
    get_cases,
    remove_party_from_case,
    update_case,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Expedientes
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=CaseListResponse,
    summary="Listar expedientes notariales",
    description="Retorna lista paginada de expedientes con filtros opcionales.",
)
def list_cases(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("cases:read"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(
        default=None, description="Buscar por número, título o descripción"
    ),
    case_type: str | None = Query(
        default=None, description="Filtrar por tipo de escritura"
    ),
    case_status: str | None = Query(default=None, alias="status"),
    assigned_user_id: str | None = Query(default=None),
) -> CaseListResponse:
    total, items = get_cases(
        db,
        skip=skip,
        limit=limit,
        search=search,
        case_type=case_type,
        case_status=case_status,
        assigned_user_id=assigned_user_id,
    )
    return CaseListResponse(total=total, items=items)


@router.get(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Obtener expediente por ID",
)
def get_case(
    case_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("cases:read"))],
) -> CaseResponse:
    db_case = get_case_by_id(db, case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expediente no encontrado."
        )
    return db_case


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear expediente notarial",
    description=(
        "Crea un nuevo expediente con número secuencial EXP-YYYY-#####. "
        "Se pueden agregar partes comparecientes en la misma llamada."
    ),
)
def create_new_case(
    case_in: CaseCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("cases:create"))],
) -> CaseResponse:
    return create_case(db, case_in, operator_user=current_user)


@router.put(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Actualizar expediente",
)
def update_existing_case(
    case_id: str,
    case_in: CaseUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("cases:update"))],
) -> CaseResponse:
    return update_case(db, case_id, case_in, operator_user=current_user)


@router.delete(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Baja lógica de expediente",
    description="Cambia el estado del expediente a CANCELADO.",
)
def cancel_case(
    case_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("cases:delete"))],
) -> CaseResponse:
    return delete_case_logical(db, case_id, operator_user=current_user)


# ---------------------------------------------------------------------------
# Partes comparecientes
# ---------------------------------------------------------------------------


@router.post(
    "/{case_id}/parties",
    response_model=CasePartyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar compareciente a expediente",
    description="Vincula un cliente existente al expediente con un rol específico.",
)
def add_party(
    case_id: str,
    party_in: AddPartyRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("cases:update"))],
) -> CasePartyResponse:
    return add_party_to_case(db, case_id, party_in, operator_user=current_user)


@router.delete(
    "/{case_id}/parties/{party_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar compareciente de expediente",
)
def remove_party(
    case_id: str,
    party_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("cases:update"))],
) -> None:
    remove_party_from_case(db, case_id, party_id, operator_user=current_user)
