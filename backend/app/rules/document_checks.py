"""Incisos, variables residuales y adjuntos: RULE-014 a 017 y 019."""

import re
from decimal import Decimal
from pathlib import Path

from app.core.config import settings
from app.rules.checks_common import base_key
from app.rules.context import ValidationContext, normalize_text
from app.rules.finding import Finding, make_finding

JINJA_REGEX = re.compile(r"\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}")


ALLOWED_ATTACHMENT_SUFFIXES = {".docx", ".xlsx", ".csv", ".pdf"}


MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024


_ORDINAL_WORDS = {
    "PRIMERO": 1,
    "PRIMERA": 1,
    "SEGUNDO": 2,
    "SEGUNDA": 2,
    "TERCERO": 3,
    "TERCERA": 3,
    "CUARTO": 4,
    "CUARTA": 4,
    "QUINTO": 5,
    "QUINTA": 5,
    "SEXTO": 6,
    "SEXTA": 6,
    "SEPTIMO": 7,
    "SEPTIMA": 7,
    "OCTAVO": 8,
    "OCTAVA": 8,
    "NOVENO": 9,
    "NOVENA": 9,
    "DECIMO": 10,
    "DECIMA": 10,
    "UNDECIMO": 11,
    "UNDECIMA": 11,
    "DUODECIMO": 12,
    "DUODECIMA": 12,
}


def _extract_ordinal(sub_path: str, value: str) -> int | None:
    """Ordinal de un inciso: campo numérico, palabra ordinal o número inicial."""
    base = base_key(sub_path)
    if base in {"numero", "orden", "indice", "inciso"}:
        try:
            return int(Decimal(str(value).strip()))
        except (ValueError, ArithmeticError, TypeError):
            return None
    normalized = normalize_text(value)
    for word, number in _ORDINAL_WORDS.items():
        if normalized.startswith(word):
            return number
    match = re.match(r"^(\d{1,2})(?:[.\):\- ]|$)", normalized)
    if match:
        return int(match.group(1))
    return None


def rule_014_015_016_clauses(ctx: ValidationContext) -> list[Finding]:
    """Integridad de la numeración de cláusulas/incisos.

    Se extrae UN ordinal por ítem: primero el campo numérico explícito
    (numero/orden/indice/inciso); si no existe, se parsea el texto
    (PRIMERA, 1., 2., etc.).
    """
    findings: list[Finding] = []
    clauses_lists: dict[str, list[tuple[int, str]]] = {}

    for list_path, items in ctx.find_list_items(["clausula", "inciso"]):
        list_name = list_path.rsplit("[", 1)[0]
        ordinal: int | None = None
        numeric = [
            r
            for r in items
            if base_key(r.field_key) in {"numero", "orden", "indice", "inciso"}
        ]
        if numeric:
            ordinal = _extract_ordinal(numeric[0].field_key, numeric[0].as_text())
        if ordinal is None:
            for resolved in items:
                ordinal = _extract_ordinal(resolved.field_key, resolved.as_text())
                if ordinal is not None:
                    break
        if ordinal is not None:
            clauses_lists.setdefault(list_name, []).append((ordinal, list_path))

    for list_name, entries in clauses_lists.items():
        ordinals = [number for number, _ in entries]

        duplicated = sorted({n for n in ordinals if ordinals.count(n) > 1})
        for number in duplicated:
            findings.append(
                make_finding(
                    "RULE-015",
                    list_name,
                    f"El inciso {number} aparece duplicado en «{list_name}».",
                    current_value=f"Inciso {number} (×{ordinals.count(number)})",
                    expected_value="Numeración única",
                    location=f"Lista {list_name}",
                )
            )

        if ordinals:
            missing = [n for n in range(1, max(ordinals) + 1) if n not in ordinals]
            for number in missing:
                findings.append(
                    make_finding(
                        "RULE-014",
                        list_name,
                        f"Falta el inciso {number} en la secuencia de «{list_name}».",
                        current_value=f"Secuencia: {sorted(ordinals)}",
                        expected_value=f"Inciso {number} presente",
                        location=f"Lista {list_name}",
                    )
                )

        if ordinals != sorted(ordinals):
            findings.append(
                make_finding(
                    "RULE-016",
                    list_name,
                    "Los incisos no aparecen en orden ascendente.",
                    current_value=f"Orden actual: {ordinals}",
                    expected_value=f"Orden esperado: {sorted(ordinals)}",
                    location=f"Lista {list_name}",
                )
            )
    return findings


def rule_017_placeholders(ctx: ValidationContext) -> list[Finding]:
    """Sintaxis {{ ... }} capturada como texto (residuo de plantilla, CRITICAL)."""
    findings: list[Finding] = []
    seen: set[str] = set()
    for resolved in ctx.iter_values():
        if not isinstance(resolved.value, str):
            continue
        for match in JINJA_REGEX.finditer(resolved.value):
            variable = match.group(1)
            if variable in seen:
                continue
            seen.add(variable)
            findings.append(
                make_finding(
                    "RULE-017",
                    resolved.field_key,
                    "El valor contiene sintaxis de plantilla sin sustituir ({{ ... }}).",
                    current_value=resolved.as_text()[:80],
                    expected_value="Texto definitivo sin marcadores",
                    location=resolved.location,
                )
            )
            if len(findings) >= 10:
                return findings
    return findings


def rule_019_attachments(ctx: ValidationContext) -> list[Finding]:
    """Adjuntos del expediente: existencia, tamaño y extensión permitida."""
    findings: list[Finding] = []
    for attachment in ctx.attachments:
        suffix = Path(attachment.original_name).suffix.lower()
        path = settings.UPLOAD_DIR / "attachments" / attachment.storage_name
        if suffix not in ALLOWED_ATTACHMENT_SUFFIXES:
            findings.append(
                make_finding(
                    "RULE-019",
                    attachment.field_key,
                    "La extensión del adjunto no está permitida (.docx/.xlsx/.csv/.pdf).",
                    current_value=attachment.original_name,
                    expected_value="Extensión permitida",
                    location=f"Adjunto del campo {attachment.field_key}",
                )
            )
        if attachment.size > MAX_ATTACHMENT_BYTES:
            findings.append(
                make_finding(
                    "RULE-019",
                    attachment.field_key,
                    "El adjunto supera el tamaño máximo de 10 MB.",
                    current_value=f"{attachment.size} bytes",
                    expected_value="≤ 10 MB",
                    location=f"Adjunto {attachment.original_name}",
                )
            )
        if not path.is_file():
            findings.append(
                make_finding(
                    "RULE-019",
                    attachment.field_key,
                    "El archivo adjunto no existe en el almacenamiento interno.",
                    current_value=attachment.original_name,
                    expected_value="Archivo presente en disco",
                    location=f"Adjunto {attachment.original_name}",
                )
            )
    return findings
