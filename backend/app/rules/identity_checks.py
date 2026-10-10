"""Campos obligatorios e identidad de comparecientes: RULE-001 a 006 y 020."""

import re

from app.rules.context import ValidationContext, normalize_identifier, normalize_text
from app.rules.finding import Finding, make_finding

DPI_REGEX = re.compile(r"^\d{13}$")


NIT_REGEX = re.compile(r"^(\d{4,15}-?[\dkK]|CF)$", re.IGNORECASE)


def rule_001_required(ctx: ValidationContext) -> list[Finding]:
    """Campos obligatorios de la plantilla sin valor capturado."""
    findings: list[Finding] = []
    for field in ctx.fields:
        if not field.required:
            continue
        value = ctx.values.get(field.key)
        empty = value is None or value == "" or value == [] or value == {}
        if empty:
            findings.append(
                make_finding(
                    "RULE-001",
                    field.docx_variable or field.key,
                    f"El campo obligatorio «{field.label}» no tiene valor capturado.",
                    current_value="(vacío)",
                    expected_value=field.label,
                    location=field.label,
                )
            )
    return findings


def rule_002_dpi_format(ctx: ValidationContext) -> list[Finding]:
    """Todo DPI capturado debe tener exactamente 13 dígitos numéricos."""
    findings: list[Finding] = []
    for resolved in ctx.find_fields(attr="dpi"):
        text = resolved.as_text()
        if text and not DPI_REGEX.fullmatch(text):
            findings.append(
                make_finding(
                    "RULE-002",
                    resolved.field_key,
                    "El DPI debe contener exactamente 13 dígitos numéricos.",
                    current_value=text,
                    expected_value="13 dígitos numéricos",
                    location=resolved.location,
                )
            )
    return findings


def rule_003_nit_format(ctx: ValidationContext) -> list[Finding]:
    """Formato de NIT guatemalteco (con guion, corrido o CF)."""
    findings: list[Finding] = []
    for resolved in ctx.find_fields(attr="nit"):
        text = resolved.as_text()
        if text and not NIT_REGEX.fullmatch(text):
            findings.append(
                make_finding(
                    "RULE-003",
                    resolved.field_key,
                    "El NIT no sigue el formato guatemalteco (ej. 1234567-8 o CF).",
                    current_value=text,
                    expected_value="1234567-8 o CF",
                    location=resolved.location,
                )
            )
    return findings


def _pair_party_values(ctx: ValidationContext, role: str, attr: str):
    """Empareja comparecientes y valores del mismo rol por orden.

    Cuando hay varios comparecientes con el mismo rol (p. ej. dos CONTRAYENTE)
    y el mismo número de campos (contrayente_uno_dpi, contrayente_dos_dpi),
    el emparejamiento es posicional; de lo contrario se compara cada valor
    contra cada compareciente (heurística conservadora).
    Los comparecientes duplicados (mismo cliente + rol) se excluyen de las
    comparaciones cruzadas: RULE-020 ya los reporta explícitamente.
    """
    seen: set[tuple[str, str]] = set()
    parties = []
    for party in ctx.party_by_role(role):
        key = (party.client_id, party.role)
        if key in seen:
            continue
        seen.add(key)
        parties.append(party)
    resolved = ctx.find_fields(role=role, attr=attr)
    if parties and resolved and len(parties) == len(resolved):
        return [(party, [value]) for party, value in zip(parties, resolved)]
    return [(party, resolved) for party in parties]


def rule_004_dpi_consistency(ctx: ValidationContext) -> list[Finding]:
    """DPI del documento vs. DPI de la ficha del cliente (CRITICAL)."""
    findings: list[Finding] = []
    roles = {party.role for party in ctx.parties}
    for role in roles:
        for party, values in _pair_party_values(ctx, role, "dpi"):
            for resolved in values:
                text = resolved.as_text()
                if text and normalize_identifier(text) != party.dpi:
                    findings.append(
                        make_finding(
                            "RULE-004",
                            resolved.field_key,
                            f"El DPI del {party.role.lower()} no coincide con el registrado en el expediente.",
                            current_value=text,
                            expected_value=party.dpi,
                            location=f"Comparecencia — {party.role} ({party.full_name})",
                        )
                    )
    return findings


def rule_005_nit_consistency(ctx: ValidationContext) -> list[Finding]:
    """NIT del documento vs. NIT de la ficha del cliente."""
    findings: list[Finding] = []
    roles = {party.role for party in ctx.parties if party.nit}
    for role in roles:
        for party, values in _pair_party_values(ctx, role, "nit"):
            if not party.nit:
                continue
            for resolved in values:
                text = resolved.as_text()
                if text and normalize_identifier(text) != normalize_identifier(
                    party.nit
                ):
                    findings.append(
                        make_finding(
                            "RULE-005",
                            resolved.field_key,
                            f"El NIT del {party.role.lower()} no coincide con la ficha del cliente.",
                            current_value=text,
                            expected_value=party.nit,
                            location=f"Comparecencia — {party.role} ({party.full_name})",
                        )
                    )
    return findings


def rule_006_name_consistency(ctx: ValidationContext) -> list[Finding]:
    """Nombre del compareciente vs. ficha maestra (CRITICAL)."""
    findings: list[Finding] = []
    roles = {party.role for party in ctx.parties}
    for role in roles:
        for party, values in _pair_party_values(ctx, role, "nombre"):
            expected = normalize_text(party.full_name)
            expected_tokens = set(expected.split())
            for resolved in values:
                text = resolved.as_text()
                if not text:
                    continue
                current = normalize_text(text)
                if current != expected and set(current.split()) != expected_tokens:
                    findings.append(
                        make_finding(
                            "RULE-006",
                            resolved.field_key,
                            f"El nombre del {party.role.lower()} no coincide con la ficha maestra del cliente.",
                            current_value=text,
                            expected_value=party.full_name,
                            location=f"Comparecencia — {party.role}",
                        )
                    )
    return findings


def rule_020_duplicates(ctx: ValidationContext) -> list[Finding]:
    """El mismo cliente no puede comparecer dos veces con el mismo rol."""
    findings: list[Finding] = []
    seen: dict[tuple[str, str], int] = {}
    for party in ctx.parties:
        key = (party.client_id, party.role)
        seen[key] = seen.get(key, 0) + 1
    for (client_id, role), count in seen.items():
        if count > 1:
            party = next(
                p for p in ctx.parties if p.client_id == client_id and p.role == role
            )
            findings.append(
                make_finding(
                    "RULE-020",
                    role.lower(),
                    f"«{party.full_name}» comparece {count} veces con el rol {role}.",
                    current_value=f"{count} comparecencias como {role}",
                    expected_value="Una comparecencia por rol",
                    location=f"Comparecientes del expediente ({party.full_name})",
                )
            )
    return findings
