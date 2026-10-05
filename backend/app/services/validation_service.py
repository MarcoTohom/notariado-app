"""Orquestación del motor de reglas notariales con persistencia (Fase 6).

Ejecuta RULE-001..RULE-020 sobre los valores del expediente, conserva el
historial de corridas en validation_runs y registra la operación en la
bitácora de auditoría.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.case import Case
from app.models.case_party import CaseParty
from app.models.client import Client
from app.models.dynamic_field import (
    CaseFieldValues,
    FieldAttachment,
    TemplateField,
    TemplateVersion,
)
from app.models.user import User
from app.models.validation import ValidationRun
from app.rules.context import PartyInfo, ValidationContext
from app.rules.engine import run_rules, summarize
from app.schemas.validation import ValidationRunResponse


def _build_context(
    db: Session,
    case_id: str,
    version_id: str,
    values_override: dict | None,
) -> ValidationContext:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(404, "Expediente no encontrado.")
    version = db.get(TemplateVersion, version_id)
    if version is None:
        raise HTTPException(404, "Versión de plantilla no encontrada.")

    # Comparecientes con su ficha maestra de cliente.
    parties: list[PartyInfo] = []
    rows = (
        db.query(CaseParty, Client)
        .join(Client, CaseParty.client_id == Client.id)
        .filter(CaseParty.case_id == case_id)
        .order_by(CaseParty.order_index)
        .all()
    )
    for party, client in rows:
        parties.append(
            PartyInfo(
                party_id=party.id,
                role=party.party_role,
                client_id=client.id,
                full_name=f"{client.first_name} {client.last_name}",
                dpi=client.dpi,
                nit=client.nit,
                tokens=[],
            )
        )

    fields = (
        db.query(TemplateField)
        .filter_by(template_version_id=version_id)
        .order_by(TemplateField.display_order, TemplateField.key)
        .all()
    )

    if values_override is not None:
        values = values_override
    else:
        stored = (
            db.query(CaseFieldValues)
            .filter_by(case_id=case_id, template_version_id=version_id)
            .first()
        )
        values = stored.values if stored else {}

    attachments = (
        db.query(FieldAttachment)
        .filter_by(case_id=case_id, template_version_id=version_id)
        .all()
    )

    return ValidationContext(
        case=case,
        parties=parties,
        fields=fields,
        values=values,
        attachments=attachments,
    )


def execute_validation(
    db: Session,
    case_id: str,
    version_id: str,
    user: User,
    values_override: dict | None = None,
) -> ValidationRunResponse:
    """Ejecuta el motor y persiste la corrida con su resultado completo."""
    ctx = _build_context(db, case_id, version_id, values_override)
    findings = run_rules(ctx)
    summary = summarize(findings)

    run = ValidationRun(
        case_id=case_id,
        template_version_id=version_id,
        executed_by_id=user.id,
        status=summary["status"],
        total_findings=summary["total"],
        critical_count=summary["critical"],
        error_count=summary["error"],
        warning_count=summary["warning"],
        info_count=summary["info"],
        findings=[finding.to_dict() for finding in findings],
    )
    db.add(run)
    db.add(
        AuditLog(
            user_id=user.id,
            user_email=user.email,
            action="VALIDATE",
            module="VALIDACIONES",
            record_id=case_id,
            status="SUCCESS",
            details=(
                f"Motor de reglas: {summary['total']} hallazgos "
                f"({summary['critical']} críticos, {summary['error']} errores) — {summary['status']}."
            ),
        )
    )
    db.commit()
    db.refresh(run)
    return ValidationRunResponse.model_validate(run)


def list_runs(
    db: Session, case_id: str, skip: int = 0, limit: int = 20
) -> tuple[int, list[ValidationRun]]:
    if db.get(Case, case_id) is None:
        raise HTTPException(404, "Expediente no encontrado.")
    query = db.query(ValidationRun).filter_by(case_id=case_id)
    total = query.count()
    items = (
        query.order_by(ValidationRun.created_at.desc()).offset(skip).limit(limit).all()
    )
    return total, items


def latest_run(db: Session, case_id: str) -> ValidationRun | None:
    if db.get(Case, case_id) is None:
        raise HTTPException(404, "Expediente no encontrado.")
    return (
        db.query(ValidationRun)
        .filter_by(case_id=case_id)
        .order_by(ValidationRun.created_at.desc())
        .first()
    )
