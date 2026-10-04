from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate
from app.services.audit_service import record_audit


def get_client_by_id(db: Session, client_id: str) -> Client | None:
    return db.query(Client).filter(Client.id == client_id).first()


def get_client_by_dpi(db: Session, dpi: str) -> Client | None:
    return db.query(Client).filter(Client.dpi == dpi).first()


def get_clients(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
    status_filter: str | None = None,
) -> tuple[int, list[Client]]:
    query = db.query(Client)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Client.first_name.ilike(search_fmt),
                Client.last_name.ilike(search_fmt),
                Client.dpi.ilike(search_fmt),
                Client.nit.ilike(search_fmt),
            )
        )

    if status_filter:
        query = query.filter(Client.status == status_filter)

    total = query.count()
    items = query.order_by(Client.created_at.desc()).offset(skip).limit(limit).all()
    return total, items


def create_client(
    db: Session, client_in: ClientCreate, operator_user: User | None = None
) -> Client:
    # Check DPI uniqueness
    if get_client_by_dpi(db, client_in.dpi):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un cliente registrado con el DPI '{client_in.dpi}'.",
        )

    db_client = Client(
        first_name=client_in.first_name,
        last_name=client_in.last_name,
        dpi=client_in.dpi,
        nit=client_in.nit,
        marital_status=client_in.marital_status,
        profession=client_in.profession,
        nationality=client_in.nationality,
        birth_date=client_in.birth_date,
        address=client_in.address,
        phone=client_in.phone,
        email=client_in.email,
        status=client_in.status,
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)

    record_audit(
        db=db,
        action="CREATE",
        module="CLIENTES",
        record_id=db_client.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Cliente {db_client.first_name} {db_client.last_name} (DPI: {db_client.dpi}) registrado",
    )

    return db_client


def update_client(
    db: Session,
    client_id: str,
    client_in: ClientUpdate,
    operator_user: User | None = None,
) -> Client:
    db_client = get_client_by_id(db, client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )

    changes = []
    update_data = client_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None and getattr(db_client, field) != value:
            setattr(db_client, field, value)
            changes.append(field)

    db.commit()
    db.refresh(db_client)

    if changes:
        record_audit(
            db=db,
            action="UPDATE",
            module="CLIENTES",
            record_id=db_client.id,
            user_id=operator_user.id if operator_user else None,
            user_email=operator_user.email if operator_user else "system",
            details=f"Cliente {db_client.dpi} modificado: {', '.join(changes)}",
        )

    return db_client


def delete_client_logical(
    db: Session, client_id: str, operator_user: User | None = None
) -> Client:
    db_client = get_client_by_id(db, client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )

    db_client.status = "INACTIVE"
    db.commit()
    db.refresh(db_client)

    record_audit(
        db=db,
        action="DELETE_LOGICAL",
        module="CLIENTES",
        record_id=db_client.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Cliente {db_client.dpi} marcado como INACTIVO",
    )

    return db_client
