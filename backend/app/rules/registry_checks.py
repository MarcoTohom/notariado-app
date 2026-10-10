"""Identificación registral y coherencia geográfica: RULE-009 a 013."""

from app.rules.context import ValidationContext, normalize_text
from app.rules.finding import Finding, make_finding
from app.rules.gt_catalog import DEPARTMENT_NAMES, MUNICIPALITY_TO_DEPARTMENT

REGISTRY_CASE_TYPES = {"COMPRAVENTA", "DONACION", "ARRENDAMIENTO"}


def _registry_check(
    ctx: ValidationContext,
    token: str,
    rule_id: str,
    label: str,
    numeric_only: bool,
) -> list[Finding]:
    findings: list[Finding] = []
    if ctx.case.case_type not in REGISTRY_CASE_TYPES:
        return findings
    resolved_values = ctx.find_fields(contains=[token])
    if not resolved_values:
        findings.append(
            make_finding(
                rule_id,
                token,
                f"El dato registral «{label}» no está capturado en el documento.",
                current_value="(ausente)",
                expected_value=label,
                location="Datos registrales del inmueble",
            )
        )
        return findings
    for resolved in resolved_values:
        text = resolved.as_text()
        if not text:
            findings.append(
                make_finding(
                    rule_id,
                    resolved.field_key,
                    f"El dato registral «{label}» está vacío.",
                    current_value="(vacío)",
                    expected_value=label,
                    location=resolved.location,
                )
            )
        elif numeric_only and not text.isdigit():
            findings.append(
                make_finding(
                    rule_id,
                    resolved.field_key,
                    f"El {label.lower()} debe contener únicamente dígitos.",
                    current_value=text,
                    expected_value=f"{label} numérico",
                    location=resolved.location,
                )
            )
    return findings


def rule_009_finca(ctx: ValidationContext) -> list[Finding]:
    return _registry_check(
        ctx, "finca", "RULE-009", "Finca registral", numeric_only=True
    )


def rule_010_folio(ctx: ValidationContext) -> list[Finding]:
    return _registry_check(
        ctx, "folio", "RULE-010", "Folio registral", numeric_only=True
    )


def rule_011_libro(ctx: ValidationContext) -> list[Finding]:
    return _registry_check(
        ctx, "libro", "RULE-011", "Libro registral", numeric_only=False
    )


def rule_012_department(ctx: ValidationContext) -> list[Finding]:
    """Departamento debe existir en el catálogo oficial (22)."""
    findings: list[Finding] = []
    for resolved in ctx.find_fields(contains=["departamento"]):
        text = resolved.as_text()
        if text and normalize_text(text) not in DEPARTMENT_NAMES:
            findings.append(
                make_finding(
                    "RULE-012",
                    resolved.field_key,
                    "El departamento indicado no existe en el catálogo oficial de Guatemala.",
                    current_value=text,
                    expected_value="Departamento válido (22 en catálogo)",
                    location=resolved.location,
                )
            )
    return findings


def rule_013_municipality(ctx: ValidationContext) -> list[Finding]:
    """Municipio coherente con el departamento indicado."""
    findings: list[Finding] = []
    departments = [
        normalize_text(v.as_text())
        for v in ctx.find_fields(contains=["departamento"])
        if v.as_text()
    ]
    department = next((d for d in departments if d in DEPARTMENT_NAMES), None)

    for resolved in ctx.find_fields(contains=["municipio"]):
        text = resolved.as_text()
        if not text:
            continue
        municipality = normalize_text(text)
        owner = MUNICIPALITY_TO_DEPARTMENT.get(municipality)
        if owner is None:
            findings.append(
                make_finding(
                    "RULE-013",
                    resolved.field_key,
                    "El municipio no consta en el catálogo; verifique la ortografía.",
                    current_value=text,
                    expected_value="Municipio del catálogo oficial",
                    location=resolved.location,
                    severity="WARNING",
                )
            )
        elif department and owner != department:
            findings.append(
                make_finding(
                    "RULE-013",
                    resolved.field_key,
                    f"El municipio «{text}» pertenece a {owner.title()}, no a {department.title()}.",
                    current_value=f"{text} / {department}",
                    expected_value=f"Municipio de {department.title()}",
                    location=resolved.location,
                    severity="ERROR",
                )
            )
    return findings
