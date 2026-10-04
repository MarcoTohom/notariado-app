from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.case import Case, CaseStatusEnum, CaseTypeEnum
from app.models.case_party import CaseParty
from app.models.client import Client
from app.models.user import User
from app.schemas.case import AddPartyRequest, CaseCreate, CaseUpdate
from app.services.audit_service import record_audit

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_VALID_TYPES = {
    CaseTypeEnum.COMPRAVENTA,
    CaseTypeEnum.DONACION,
    CaseTypeEnum.ARRENDAMIENTO,
    CaseTypeEnum.MATRIMONIO,
    CaseTypeEnum.SOCIEDAD,
}

_VALID_STATUSES = {
    CaseStatusEnum.ABIERTO,
    CaseStatusEnum.EN_REVISION,
    CaseStatusEnum.PENDIENTE,
    CaseStatusEnum.FINALIZADO,
    CaseStatusEnum.CANCELADO,
}


def _next_case_sequence(db: Session) -> int:
    """Returns the next sequential integer for the current calendar year.

    Uses MAX() on existing case numbers to be safe even when transactions
    from previous test runs share the same in-memory database.
    """
    from sqlalchemy import func

    year = datetime.now(timezone.utc).year
    prefix = f"EXP-{year}-"

    # Query the maximum case_number for this year
    max_number: str | None = (
        db.query(func.max(Case.case_number))
        .filter(Case.case_number.like(f"{prefix}%"))
        .scalar()
    )

    if max_number:
        try:
            seq = int(max_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1

    return seq


def _ensure_client_exists(db: Session, client_id: str) -> Client:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con id='{client_id}' no encontrado.",
        )
    return client


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


def get_case_by_id(db: Session, case_id: str) -> Case | None:
    return db.query(Case).filter(Case.id == case_id).first()


def get_case_by_number(db: Session, case_number: str) -> Case | None:
    return db.query(Case).filter(Case.case_number == case_number).first()


def get_cases(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
    case_type: str | None = None,
    case_status: str | None = None,
    assigned_user_id: str | None = None,
) -> tuple[int, list[Case]]:
    query = db.query(Case)

    if search:
        fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Case.case_number.ilike(fmt),
                Case.title.ilike(fmt),
                Case.description.ilike(fmt),
            )
        )

    if case_type:
        query = query.filter(Case.case_type == case_type)

    if case_status:
        query = query.filter(Case.status == case_status)

    if assigned_user_id:
        query = query.filter(Case.assigned_user_id == assigned_user_id)

    total = query.count()
    items = query.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
    return total, items


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


def create_case(
    db: Session, case_in: CaseCreate, operator_user: User | None = None
) -> Case:
    if case_in.case_type not in _VALID_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de escritura inválido: '{case_in.case_type}'. "
            f"Valores permitidos: {', '.join(_VALID_TYPES)}.",
        )

    seq = _next_case_sequence(db)
    case_number = Case.generate_case_number(seq)

    db_case = Case(
        case_number=case_number,
        case_type=case_in.case_type,
        status=CaseStatusEnum.ABIERTO,
        title=case_in.title.strip(),
        description=case_in.description,
        internal_notes=case_in.internal_notes,
        instrument_number=case_in.instrument_number,
        protocol_folio=case_in.protocol_folio,
        protocol_book=case_in.protocol_book,
        assigned_user_id=case_in.assigned_user_id,
        opened_at=datetime.now(timezone.utc),
    )
    db.add(db_case)
    db.flush()  # get the ID before adding parties

    # Add initial parties if provided
    for party_data in case_in.parties:
        _ensure_client_exists(db, party_data.client_id)
        db_party = CaseParty(
            case_id=db_case.id,
            client_id=party_data.client_id,
            party_role=party_data.party_role,
            notes=party_data.notes,
            order_index=party_data.order_index,
        )
        db.add(db_party)

    db.commit()
    db.refresh(db_case)

    record_audit(
        db=db,
        action="CREATE",
        module="EXPEDIENTES",
        record_id=db_case.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Expediente {db_case.case_number} ({db_case.case_type}) creado con {len(case_in.parties)} parte(s)",
    )

    return db_case


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


def update_case(
    db: Session,
    case_id: str,
    case_in: CaseUpdate,
    operator_user: User | None = None,
) -> Case:
    db_case = get_case_by_id(db, case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expediente no encontrado.",
        )

    changes: list[str] = []
    update_data = case_in.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] is not None:
        new_status = update_data["status"]
        if new_status not in _VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado inválido: '{new_status}'.",
            )
        if new_status != db_case.status:
            if new_status in (CaseStatusEnum.FINALIZADO, CaseStatusEnum.CANCELADO):
                db_case.closed_at = datetime.now(timezone.utc)
            db_case.status = new_status
            changes.append(f"status={new_status}")
        del update_data["status"]

    for field, value in update_data.items():
        if value is not None and getattr(db_case, field, None) != value:
            setattr(db_case, field, value)
            changes.append(field)

    db.commit()
    db.refresh(db_case)

    if changes:
        record_audit(
            db=db,
            action="UPDATE",
            module="EXPEDIENTES",
            record_id=db_case.id,
            user_id=operator_user.id if operator_user else None,
            user_email=operator_user.email if operator_user else "system",
            details=f"Expediente {db_case.case_number} modificado: {', '.join(changes)}",
        )

    return db_case


# ---------------------------------------------------------------------------
# Delete (logical)
# ---------------------------------------------------------------------------


def delete_case_logical(
    db: Session, case_id: str, operator_user: User | None = None
) -> Case:
    db_case = get_case_by_id(db, case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expediente no encontrado.",
        )

    db_case.status = CaseStatusEnum.CANCELADO
    db_case.closed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_case)

    record_audit(
        db=db,
        action="DELETE_LOGICAL",
        module="EXPEDIENTES",
        record_id=db_case.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Expediente {db_case.case_number} marcado como CANCELADO",
    )

    return db_case


# ---------------------------------------------------------------------------
# Case Parties
# ---------------------------------------------------------------------------


def add_party_to_case(
    db: Session,
    case_id: str,
    party_in: AddPartyRequest,
    operator_user: User | None = None,
) -> CaseParty:
    db_case = get_case_by_id(db, case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expediente no encontrado.",
        )

    _ensure_client_exists(db, party_in.client_id)

    # Check for duplicate role+client combination
    existing = (
        db.query(CaseParty)
        .filter(
            CaseParty.case_id == case_id,
            CaseParty.client_id == party_in.client_id,
            CaseParty.party_role == party_in.party_role,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este cliente ya está registrado con ese rol en el expediente.",
        )

    db_party = CaseParty(
        case_id=case_id,
        client_id=party_in.client_id,
        party_role=party_in.party_role,
        notes=party_in.notes,
        order_index=party_in.order_index,
    )
    db.add(db_party)
    db.commit()
    db.refresh(db_party)

    record_audit(
        db=db,
        action="CREATE",
        module="EXPEDIENTES_PARTES",
        record_id=db_party.id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Parte {party_in.party_role} (client={party_in.client_id}) agregada al expediente {db_case.case_number}",
    )

    return db_party


def remove_party_from_case(
    db: Session,
    case_id: str,
    party_id: str,
    operator_user: User | None = None,
) -> None:
    db_case = get_case_by_id(db, case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expediente no encontrado.",
        )

    db_party = (
        db.query(CaseParty)
        .filter(CaseParty.id == party_id, CaseParty.case_id == case_id)
        .first()
    )
    if not db_party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compareciente no encontrado en este expediente.",
        )

    record_audit(
        db=db,
        action="DELETE",
        module="EXPEDIENTES_PARTES",
        record_id=party_id,
        user_id=operator_user.id if operator_user else None,
        user_email=operator_user.email if operator_user else "system",
        details=f"Parte {db_party.party_role} eliminada del expediente {db_case.case_number}",
    )

    db.delete(db_party)
    db.commit()
