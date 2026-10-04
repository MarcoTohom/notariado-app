from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.legal_entity import LegalEntity
from app.models.user import User
from app.schemas.legal_entity import LegalEntityCreate, LegalEntityUpdate
from app.services.audit_service import record_audit

# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


def get_legal_entity_by_id(db: Session, entity_id: str) -> LegalEntity | None:
    return db.query(LegalEntity).filter(LegalEntity.id == entity_id).first()


def get_legal_entity_by_nit(db: Session, nit: str) -> LegalEntity | None:
    return db.query(LegalEntity).filter(LegalEntity.nit == nit).first()


def get_legal_entities(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
    society_type: str | None = None,
    status_filter: str | None = None,
) -> tuple[int, list[LegalEntity]]:
    query = db.query(LegalEntity)

    if search:
        fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                LegalEntity.business_name.ilike(fmt),
                LegalEntity.nit.ilike(fmt),
                LegalEntity.trade_name.ilike(fmt),
            )
        )

    if society_type:
        query = query.filter(LegalEntity.society_type == society_type)

    if status_filter:
        query = query.filter(LegalEntity.status == status_filter)

    total = query.count()
    items = (
        query.order_by(LegalEntity.created_at.desc()).offset(skip).limit(limit).all()
    )
    return total, items


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


def create_legal_entity(
    db: Session,
    entity_in: LegalEntityCreate,
    operator_user: User | None = None,
) -> LegalEntity:
    # NIT uniqueness check
    if get_legal_entity_by_nit(db, entity_in.nit):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una persona jurídica registrada con el NIT '{entity_in.nit}'.",
        )

    # Validate representative if provided
    if entity_in.legal_representative_id:
        rep = (
            db.query(Client)
            .filter(Client.id == entity_in.legal_representative_id)
            .first()
        )
        if not rep:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Representante legal (cliente) con id='{entity_in.legal_representative_id}' no encontrado.",
            )

    db_entity = LegalEntity(
        business_name=entity_in.business_name.strip(),
        trade_name=entity_in.trade_name,
        nit=entity_in.nit.strip(),
        society_type=entity_in.society_type,
        registry_number=entity_in.registry_number,
        registry_folio=entity_in.registry_folio,
        registry_book=entity_in.registry_book,
        legal_representative_id=entity_in.legal_representative_id,
        representative_position=entity_in.representative_position,
        address=entity_in.address,
        phone=entity_in.phone,
        email=entity_in.email,
        status=entity_in.status,
    )
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)

    record_audit(
        db=db,
        action="CREATE",
        module="PERSONAS_JURIDICAS",
        record_id=db_entity.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Persona jurídica '{db_entity.business_name}' (NIT: {db_entity.nit}) registrada",
    )

    return db_entity


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


def update_legal_entity(
    db: Session,
    entity_id: str,
    entity_in: LegalEntityUpdate,
    operator_user: User | None = None,
) -> LegalEntity:
    db_entity = get_legal_entity_by_id(db, entity_id)
    if not db_entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona jurídica no encontrada.",
        )

    # Validate representative if being changed
    if (
        entity_in.legal_representative_id is not None
        and entity_in.legal_representative_id != db_entity.legal_representative_id
    ):
        rep = (
            db.query(Client)
            .filter(Client.id == entity_in.legal_representative_id)
            .first()
        )
        if not rep:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Representante legal (cliente) con id='{entity_in.legal_representative_id}' no encontrado.",
            )

    changes: list[str] = []
    update_data = entity_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None and getattr(db_entity, field, None) != value:
            setattr(db_entity, field, value)
            changes.append(field)

    db.commit()
    db.refresh(db_entity)

    if changes:
        record_audit(
            db=db,
            action="UPDATE",
            module="PERSONAS_JURIDICAS",
            record_id=db_entity.id,
            user_id=operator_user.id if operator_user else None,
            user_email=operator_user.email if operator_user else "system",
            details=f"Persona jurídica NIT={db_entity.nit} modificada: {', '.join(changes)}",
        )

    return db_entity


# ---------------------------------------------------------------------------
# Delete (logical)
# ---------------------------------------------------------------------------


def delete_legal_entity_logical(
    db: Session, entity_id: str, operator_user: User | None = None
) -> LegalEntity:
    db_entity = get_legal_entity_by_id(db, entity_id)
    if not db_entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona jurídica no encontrada.",
        )

    db_entity.status = "INACTIVE"
    db.commit()
    db.refresh(db_entity)

    record_audit(
        db=db,
        action="DELETE_LOGICAL",
        module="PERSONAS_JURIDICAS",
        record_id=db_entity.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Persona jurídica NIT={db_entity.nit} marcada como INACTIVA",
    )

    return db_entity
