from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.user import User
from app.schemas.user import UserCreate, UserListResponse, UserResponse, UserUpdate
from app.services import user_service

router = APIRouter()


@router.get(
    "",
    response_model=UserListResponse,
    summary="Listado paginado de usuarios",
    description="Permite buscar y filtrar usuarios del sistema. Requiere permiso 'users:read'.",
)
def list_users(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("users:read"))],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    search: Annotated[
        str | None, Query(description="Búsqueda por nombre, usuario o email")
    ] = None,
    role: Annotated[str | None, Query(description="Filtrar por rol")] = None,
    status_filter: Annotated[
        str | None, Query(alias="status", description="Filtrar por estado")
    ] = None,
) -> UserListResponse:
    total, items = user_service.get_users(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        role=role,
        status_filter=status_filter,
    )
    return UserListResponse(total=total, items=items)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo usuario",
    description="Registra un nuevo usuario con contraseña cifrada en Argon2. Requiere 'users:create'.",
)
def create_new_user(
    user_in: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("users:create"))],
) -> UserResponse:
    return user_service.create_user(db=db, user_in=user_in, operator_user=current_user)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Consultar usuario por ID",
    description="Retorna el detalle del usuario solicitado. Requiere 'users:read'.",
)
def get_user(
    user_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("users:read"))],
) -> UserResponse:
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return user


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Actualizar información de usuario",
    description="Permite modificar rol, estado, email o contraseña. Requiere 'users:update'.",
)
def update_user_details(
    user_id: str,
    user_in: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("users:update"))],
) -> UserResponse:
    return user_service.update_user(
        db=db, user_id=user_id, user_in=user_in, operator_user=current_user
    )


@router.delete(
    "/{user_id}",
    response_model=UserResponse,
    summary="Desactivar usuario (eliminación lógica)",
    description="Cambia el estado a INACTIVE preservando integridad referencial. Requiere 'users:delete'.",
)
def delete_user(
    user_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("users:delete"))],
) -> UserResponse:
    return user_service.delete_user_logical(
        db=db, user_id=user_id, operator_user=current_user
    )
