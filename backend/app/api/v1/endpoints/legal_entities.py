from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.schemas.legal_entity import (
    LegalEntityCreate,
    LegalEntityListResponse,
    LegalEntityResponse,
    LegalEntityUpdate,
)
from app.services.legal_entity_service import (
    create_legal_entity,
    delete_legal_entity_logical,
    get_legal_entities,
    get_legal_entity_by_id,
    update_legal_entity,
)

router = APIRouter()


@router.get(
    "",
    response_model=LegalEntityListResponse,
    summary="Listar personas jurídicas",
    description="Retorna lista paginada de personas jurídicas (sociedades, asociaciones, fundaciones).",
)
def list_legal_entities(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("clients:read"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(
        default=None, description="Buscar por razón social, NIT o nombre comercial"
    ),
    society_type: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
) -> LegalEntityListResponse:
    total, items = get_legal_entities(
        db,
        skip=skip,
        limit=limit,
        search=search,
        society_type=society_type,
        status_filter=status_filter,
    )
    return LegalEntityListResponse(total=total, items=items)


@router.get(
    "/{entity_id}",
    response_model=LegalEntityResponse,
    summary="Obtener persona jurídica por ID",
)
def get_legal_entity(
    entity_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("clients:read"))],
) -> LegalEntityResponse:
    db_entity = get_legal_entity_by_id(db, entity_id)
    if not db_entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona jurídica no encontrada.",
        )
    return db_entity


@router.post(
    "",
    response_model=LegalEntityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar persona jurídica",
    description="Crea una nueva persona jurídica. NIT se almacena siempre como texto.",
)
def create_new_legal_entity(
    entity_in: LegalEntityCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("clients:create"))],
) -> LegalEntityResponse:
    return create_legal_entity(db, entity_in, operator_user=current_user)


@router.put(
    "/{entity_id}",
    response_model=LegalEntityResponse,
    summary="Actualizar persona jurídica",
)
def update_existing_legal_entity(
    entity_id: str,
    entity_in: LegalEntityUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("clients:update"))],
) -> LegalEntityResponse:
    return update_legal_entity(db, entity_id, entity_in, operator_user=current_user)


@router.delete(
    "/{entity_id}",
    response_model=LegalEntityResponse,
    summary="Baja lógica de persona jurídica",
)
def deactivate_legal_entity(
    entity_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("clients:delete"))],
) -> LegalEntityResponse:
    return delete_legal_entity_logical(db, entity_id, operator_user=current_user)
