from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def record_audit(
    db: Session,
    action: str,
    module: str,
    record_id: str | None = None,
    user_id: str | None = None,
    user_email: str | None = None,
    details: str | None = None,
    ip_address: str | None = None,
    status: str = "SUCCESS",
) -> AuditLog:
    """Creates and commits an audit log entry while sanitizing sensitive content."""
    # Ensure details do not store full passwords or tokens
    safe_details = details
    if safe_details and (
        "password" in safe_details.lower() or "token" in safe_details.lower()
    ):
        safe_details = "[INFORMACION SENSIBLE OMITIDA POR POLITICA DE SEGURIDAD]"

    log_entry = AuditLog(
        action=action,
        module=module,
        record_id=record_id,
        user_id=user_id,
        user_email=user_email,
        details=safe_details,
        ip_address=ip_address,
        status=status,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
