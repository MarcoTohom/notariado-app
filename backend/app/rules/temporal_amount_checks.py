"""Fechas, montos en letras y porcentajes: RULE-007, 008 y 018."""

import re
from datetime import date
from decimal import Decimal

from app.rules.checks_common import base_key, parent_path
from app.rules.context import ValidationContext, normalize_text
from app.rules.finding import Finding, make_finding
from app.rules.number_words import amount_to_words

_FILLER_WORDS = {
    "DE",
    "LA",
    "EL",
    "LOS",
    "LAS",
    "QUETZALES",
    "QUETZAL",
    "DOLARES",
    "DOLAR",
    "EXACTOS",
    "EXACTAS",
    "CENTAVOS",
    "CON",
    "Y",
    "MN",
    "Q",
    "MONEDA",
    "NACIONAL",
    "LEGALES",
    "CORRIENTE",
    "EN",
    "SON",
}


_CURRENCY_HINTS = ("precio", "monto", "valor", "renta", "capital", "honorario")


_LETTERS_HINTS = ("letras", "escrito", "literal")


def _letters_only(text: str) -> str:
    """Secuencia de letras sin palabras de relleno ni acentos (RULE-008)."""
    normalized = normalize_text(text)
    tokens = [t for t in re.findall(r"[A-Z]+", normalized) if t not in _FILLER_WORDS]
    return "".join(tokens)


def rule_007_dates(ctx: ValidationContext) -> list[Finding]:
    """Fechas futuras prohibidas y rangos inicio/fin coherentes."""
    findings: list[Finding] = []
    boundaries: dict[str, dict[str, tuple[date, str]]] = {}

    for resolved in ctx.find_fields(attr="fecha"):
        base = base_key(resolved.field_key)
        parsed = resolved.as_date()
        if parsed is None:
            continue
        if "nacimiento" in base and parsed > ctx.today:
            findings.append(
                make_finding(
                    "RULE-007",
                    resolved.field_key,
                    "La fecha de nacimiento no puede ser futura.",
                    current_value=parsed.isoformat(),
                    expected_value=f"≤ {ctx.today.isoformat()}",
                    location=resolved.location,
                )
            )
        if (
            any(hint in base for hint in ("escritura", "otorgamiento"))
            and parsed > ctx.today
        ):
            findings.append(
                make_finding(
                    "RULE-007",
                    resolved.field_key,
                    "La fecha de la escritura no puede ser futura.",
                    current_value=parsed.isoformat(),
                    expected_value=f"≤ {ctx.today.isoformat()}",
                    location=resolved.location,
                )
            )
        parent = parent_path(resolved.field_key)
        slot = boundaries.setdefault(parent, {})
        if "inicio" in base:
            slot["inicio"] = (parsed, resolved.field_key)
        elif "fin" in base:
            slot["fin"] = (parsed, resolved.field_key)

    for parent, slot in boundaries.items():
        if "inicio" in slot and "fin" in slot:
            (start, start_key), (end, _) = slot["inicio"], slot["fin"]
            if start > end:
                findings.append(
                    make_finding(
                        "RULE-007",
                        start_key,
                        "La fecha de inicio es posterior a la fecha de fin (plazo invertido).",
                        current_value=f"{start.isoformat()} → {end.isoformat()}",
                        expected_value="inicio ≤ fin",
                        location=parent or start_key,
                    )
                )
    return findings


def rule_008_amount_letters(ctx: ValidationContext) -> list[Finding]:
    """Montos en cifra vs. su redacción en letras (Art. 30 Código de Notariado)."""
    findings: list[Finding] = []
    all_values = ctx.iter_values()

    letter_fields = [
        v
        for v in all_values
        if any(hint in base_key(v.field_key) for hint in _LETTERS_HINTS)
    ]
    for resolved in all_values:
        base = base_key(resolved.field_key)
        if not any(hint in base for hint in _CURRENCY_HINTS):
            continue
        if any(hint in base for hint in _LETTERS_HINTS):
            continue
        amount = resolved.as_decimal()
        if amount is None or amount < 0:
            continue
        parent = parent_path(resolved.field_key)
        sibling = next(
            (
                lf
                for lf in letter_fields
                if parent_path(lf.field_key) == parent
                and any(
                    hint in lf.field_key.lower() and hint in base
                    for hint in _CURRENCY_HINTS
                )
            ),
            None,
        )
        if sibling is None:
            continue
        written = sibling.as_text()
        if not written:
            continue
        currency = "DOLARES" if "dolar" in base else "QUETZALES"
        expected = amount_to_words(amount, currency)
        if _letters_only(written) != _letters_only(expected):
            findings.append(
                make_finding(
                    "RULE-008",
                    sibling.field_key,
                    "El monto en números no corresponde a su redacción en letras.",
                    current_value=written,
                    expected_value=expected,
                    location=resolved.location,
                )
            )
    return findings


def rule_018_percentage_sum(ctx: ValidationContext) -> list[Finding]:
    """Porcentajes de aportación societaria deben sumar 100% (Código de Comercio)."""
    findings: list[Finding] = []
    lists: dict[str, Decimal] = {}
    for list_path, items in ctx.find_list_items(["socio", "accionista", "aportacion"]):
        list_name = list_path.rsplit("[", 1)[0]
        for resolved in items:
            if "porcentaje" not in base_key(resolved.field_key):
                continue
            value = resolved.as_decimal()
            if value is not None:
                lists[list_name] = lists.get(list_name, Decimal(0)) + value

    for list_name, total in lists.items():
        if abs(total - Decimal(100)) > Decimal("0.01"):
            findings.append(
                make_finding(
                    "RULE-018",
                    list_name,
                    "La suma de porcentajes de aportación no totaliza el 100% del capital.",
                    current_value=f"{total}%",
                    expected_value="100%",
                    location=f"Lista {list_name} (aportaciones de socios)",
                )
            )
    return findings
