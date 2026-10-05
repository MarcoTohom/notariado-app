"""Hallazgo individual producido por una regla del motor."""

from dataclasses import dataclass

from app.rules.catalog import RULES_CATALOG


@dataclass
class Finding:
    """Estructura estandarizada del reporte (skill notarial-rule-engine)."""

    rule_id: str
    severity: str
    field_key: str
    message: str
    current_value: str
    expected_value: str
    location: str

    def to_dict(self) -> dict:
        return {
            "rule_id": self.rule_id,
            "severity": self.severity,
            "field_key": self.field_key,
            "message": self.message,
            "current_value": self.current_value,
            "expected_value": self.expected_value,
            "location": self.location,
        }


def make_finding(
    rule_id: str,
    field_key: str,
    message: str,
    current_value: str = "",
    expected_value: str = "",
    location: str = "",
    severity: str | None = None,
) -> Finding:
    """Construye un hallazgo tomando la severidad del catálogo (o la indicada)."""
    return Finding(
        rule_id=rule_id,
        severity=severity or RULES_CATALOG[rule_id]["severity"],
        field_key=field_key,
        message=message,
        current_value=current_value,
        expected_value=expected_value,
        location=location or field_key,
    )
