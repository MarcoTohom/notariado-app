from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.schemas.client import (
    ClientCreate,
    ClientListResponse,
    ClientResponse,
    ClientUpdate,
)
from app.services.client_service import (
    create_client,
    delete_client_logical,
    get_client_by_id,
    get_clients,
    update_client,
)

router = APIRouter()


@router.get(
    "",
    response_model=ClientListResponse,
    summary="Listar clientes (personas individuales)",
    description="Retorna lista paginada de personas individuales con filtros opcionales.",
)
def list_clients(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("clients:read"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(
        default=None, description="Buscar por nombre, DPI o NIT"
    ),
    status_filter: str | None = Query(default=None, alias="status"),
) -> ClientListResponse:
    total, items = get_clients(
        db, skip=skip, limit=limit, search=search, status_filter=status_filter
    )
    return ClientListResponse(total=total, items=items)


@router.get(
    "/{client_id}",
    response_model=ClientResponse,
    summary="Obtener cliente por ID",
)
def get_client(
    client_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("clients:read"))],
) -> ClientResponse:
    db_client = get_client_by_id(db, client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado."
        )
    return db_client


@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar cliente (persona individual)",
    description="Crea un nuevo cliente. DPI debe ser exactamente 13 dígitos numéricos como texto.",
)
def create_new_client(
    client_in: ClientCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("clients:create"))],
) -> ClientResponse:
    return create_client(db, client_in, operator_user=current_user)


@router.put(
    "/{client_id}",
    response_model=ClientResponse,
    summary="Actualizar cliente",
)
def update_existing_client(
    client_id: str,
    client_in: ClientUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("clients:update"))],
) -> ClientResponse:
    return update_client(db, client_id, client_in, operator_user=current_user)


@router.delete(
    "/{client_id}",
    response_model=ClientResponse,
    summary="Baja lógica de cliente",
    description="Marca el cliente como INACTIVO (eliminación lógica, no física).",
)
def deactivate_client(
    client_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("clients:delete"))],
) -> ClientResponse:
    return delete_client_logical(db, client_id, operator_user=current_user)
