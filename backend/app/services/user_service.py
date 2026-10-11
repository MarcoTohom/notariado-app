from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.roles import RoleEnum, UserStatusEnum
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_service import record_audit


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
    role: str | None = None,
    status_filter: str | None = None,
) -> tuple[int, list[User]]:
    query = db.query(User)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(search_fmt),
                User.full_name.ilike(search_fmt),
                User.email.ilike(search_fmt),
            )
        )

    if role:
        query = query.filter(User.role == role)

    if status_filter:
        query = query.filter(User.status == status_filter)

    total = query.count()
    items = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return total, items


def create_user(
    db: Session, user_in: UserCreate, operator_user: User | None = None
) -> User:
    # Check username uniqueness
    if get_user_by_username(db, user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El nombre de usuario '{user_in.username}' ya se encuentra registrado.",
        )

    # Check email uniqueness
    if get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El correo electrónico '{user_in.email}' ya se encuentra registrado.",
        )

    # Validate role
    try:
        RoleEnum(user_in.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El rol '{user_in.role}' no es válido.",
        )

    db_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower(),
        full_name=user_in.full_name.strip(),
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        status=user_in.status,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Record audit
    record_audit(
        db=db,
        action="CREATE",
        module="USUARIOS",
        record_id=db_user.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Usuario {db_user.username} creado con rol {db_user.role}",
    )

    return db_user


def update_user(
    db: Session, user_id: str, user_in: UserUpdate, operator_user: User | None = None
) -> User:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado."
        )

    # Self-protection for administrator
    if operator_user and operator_user.id == db_user.id:
        if user_in.status is not None and user_in.status != UserStatusEnum.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No es posible desactivar la propia cuenta de administrador en sesión.",
            )
        if (
            user_in.role is not None
            and user_in.role != RoleEnum.ADMINISTRADOR.value
            and db_user.role == RoleEnum.ADMINISTRADOR.value
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No es posible retirar el rol ADMINISTRADOR de la propia cuenta en sesión.",
            )

    changes = []
    is_permission_change = False

    if user_in.full_name is not None and user_in.full_name.strip() != db_user.full_name:
        db_user.full_name = user_in.full_name.strip()
        changes.append("full_name")

    if user_in.email is not None and user_in.email.strip().lower() != db_user.email:
        existing = get_user_by_email(db, user_in.email)
        if existing and existing.id != db_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya pertenece a otro usuario.",
            )
        db_user.email = user_in.email.strip().lower()
        changes.append("email")

    if user_in.role is not None and user_in.role != db_user.role:
        try:
            RoleEnum(user_in.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido."
            )
        db_user.role = user_in.role
        changes.append(f"role={user_in.role}")
        is_permission_change = True

    if user_in.status is not None and user_in.status != db_user.status:
        try:
            UserStatusEnum(user_in.status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Estado inválido."
            )
        db_user.status = user_in.status
        changes.append(f"status={user_in.status}")
        is_permission_change = True

    if user_in.permission_overrides is not None:
        grant_list = [str(p) for p in user_in.permission_overrides.get("grant", [])]
        revoke_list = [str(p) for p in user_in.permission_overrides.get("revoke", [])]
        db_user.permission_overrides = {"grant": grant_list, "revoke": revoke_list}
        changes.append("permission_overrides")
        is_permission_change = True

    if user_in.password:
        db_user.password_hash = get_password_hash(user_in.password)
        changes.append("password")

    db.commit()
    db.refresh(db_user)

    if changes:
        action = "PERMISSION_CHANGE" if is_permission_change else "UPDATE"
        record_audit(
            db=db,
            action=action,
            module="USUARIOS",
            record_id=db_user.id,
            user_id=operator_user.id if operator_user else None,
            user_email=operator_user.email if operator_user else "system",
            details=f"Usuario {db_user.username} modificado: {', '.join(changes)}",
        )

    return db_user


def delete_user_logical(
    db: Session, user_id: str, operator_user: User | None = None
) -> User:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado."
        )

    # Prevent deleting own account if administrator
    if operator_user and operator_user.id == db_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No es posible desactivar la propia cuenta de administrador en sesión.",
        )

    db_user.status = UserStatusEnum.INACTIVE.value
    db.commit()
    db.refresh(db_user)

    record_audit(
        db=db,
        action="DELETE_LOGICAL",
        module="USUARIOS",
        record_id=db_user.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Usuario {db_user.username} marcado como INACTIVO",
    )

    return db_user
