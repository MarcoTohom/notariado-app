"""Operaciones de sesión compartidas con rollback y errores de conflicto."""

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError


def require_record(db, model, record_id):
    record = db.get(model, record_id)
    if record is None:
        raise HTTPException(404, "Registro no encontrado.")
    return record


def commit(db):
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            409, "El registro cambió. Recargue antes de guardar."
        ) from exc


def flush(db):
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            409, "El registro cambió. Recargue antes de guardar."
        ) from exc
