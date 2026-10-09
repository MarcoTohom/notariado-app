"""Contexto común de expediente para reglas, documentos y experimento."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.case_field_values import CaseFieldValues
from app.models.case_party import CaseParty
from app.models.client import Client
from app.models.dynamic_field import TemplateField
from app.models.field_attachment import FieldAttachment
from app.models.template import TemplateVersion
from app.rules.context import PartyInfo, ValidationContext


def build_validation_context(
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
