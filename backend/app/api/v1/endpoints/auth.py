from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.roles import get_effective_permissions
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserSession
from app.services.audit_service import record_audit

router = APIRouter()


def _authenticate_and_issue_token(
    db: Session, username_or_email: str, password: str, request: Request
) -> Token:
    user = (
        db.query(User)
        .filter(
            (User.username == username_or_email)
            | (User.email == username_or_email.lower())
        )
        .first()
    )

    client_ip = request.client.host if request.client else "unknown"

    if not user or not verify_password(password, user.password_hash):
        record_audit(
            db=db,
            action="LOGIN",
            module="SEGURIDAD",
            user_email=username_or_email,
            ip_address=client_ip,
            status="FAILURE",
            details="Intento fallido de inicio de sesión: credenciales inválidas.",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "ACTIVE":
        record_audit(
            db=db,
            action="LOGIN",
            module="SEGURIDAD",
            user_id=user.id,
            user_email=user.email,
            ip_address=client_ip,
            status="FAILURE",
            details=f"Intento de inicio de sesión con cuenta inactiva o suspendida ({user.status}).",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"La cuenta está en estado '{user.status}'.",
        )

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token_str = create_access_token(
        subject=user.id,
        extra_claims={
            "username": user.username,
            "role": user.role,
            "email": user.email,
        },
    )

    record_audit(
        db=db,
        action="LOGIN",
        module="SEGURIDAD",
        user_id=user.id,
        user_email=user.email,
        ip_address=client_ip,
        status="SUCCESS",
        details=f"Inicio de sesión exitoso como {user.role}",
    )

    return Token(
        access_token=token_str,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Inicio de sesión por formulario o JSON",
    description="Autentica usuario con Argon2 y emite token JWT con tiempo de expiración.",
)
async def login(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    login_data: LoginRequest | None = None,
) -> Token:
    username = None
    password = None

    if login_data:
        username = login_data.username_or_email
        password = login_data.password
    else:
        ct = request.headers.get("content-type", "")
        if "form" in ct:
            form = await request.form()
            username = form.get("username")
            password = form.get("password")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requieren credenciales (username/password).",
        )

    return _authenticate_and_issue_token(db, str(username), str(password), request)


@router.get(
    "/me",
    response_model=UserSession,
    summary="Perfil y permisos del usuario actual",
    description="Retorna la identidad del usuario autenticado y su lista de permisos según rol.",
)
def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserSession:
    permissions = get_effective_permissions(
        current_user.role, current_user.permission_overrides
    )
    return UserSession(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        status=current_user.status,
        permissions=permissions,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Cierre de sesión",
    description="Registra la salida en la bitácora de auditoría.",
)
def logout(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    client_ip = request.client.host if request.client else "unknown"
    record_audit(
        db=db,
        action="LOGOUT",
        module="SEGURIDAD",
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=client_ip,
        status="SUCCESS",
        details="Cierre voluntario de sesión notarial.",
    )
    return {"message": "Sesión finalizada exitosamente."}
