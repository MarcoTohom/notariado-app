"""Motor de reglas notariales: ejecuta el catálogo y resume el resultado.

Flujo (skill notarial-rule-engine):
1) validaciones estructurales (RULE-001..003)
2) consistencia cruzada contra fichas maestras (RULE-004..013, 020)
3) integridad documental (RULE-014..019)
El resultado se ordena por severidad para el Panel de Inconsistencias.
"""

from app.rules.catalog import RULES_CATALOG, SEVERITY_ORDER
from app.rules.checks import RULE_FUNCTIONS
from app.rules.context import ValidationContext
from app.rules.finding import Finding


def run_rules(ctx: ValidationContext) -> list[Finding]:
    """Ejecuta RULE-001..RULE-020 y ordena por severidad e identificador."""
    findings: list[Finding] = []
    for rule_function in RULE_FUNCTIONS:
        findings.extend(rule_function(ctx))
    findings.sort(
        key=lambda f: (SEVERITY_ORDER.get(f.severity, 4), f.rule_id, f.field_key)
    )
    return findings


def summarize(findings: list[Finding]) -> dict:
    """Conteos por severidad y estado global de la revisión."""
    counts = {"CRITICAL": 0, "ERROR": 0, "WARNING": 0, "INFO": 0}
    for finding in findings:
        counts[finding.severity] = counts.get(finding.severity, 0) + 1
    if counts["CRITICAL"] or counts["ERROR"]:
        status = "CON_INCONSISTENCIAS"
    elif counts["WARNING"]:
        status = "CON_ADVERTENCIAS"
    else:
        status = "LIMPIO"
    return {
        "status": status,
        "total": len(findings),
        "critical": counts["CRITICAL"],
        "error": counts["ERROR"],
        "warning": counts["WARNING"],
        "info": counts["INFO"],
    }


def rule_catalog_public() -> list[dict]:
    """Catálogo de reglas con metadatos para documentación y UI."""
    return [
        {"rule_id": rule_id, **metadata} for rule_id, metadata in RULES_CATALOG.items()
    ]
