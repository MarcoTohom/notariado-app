"""Implementación de las 20 reglas de consistencia documental notarial.

Cada función recibe el ValidationContext y devuelve hallazgos (Finding).
Las reglas toleran la ausencia de datos: solo RULE-001 reporta faltantes;
las demás evalúan únicamente la información efectivamente capturada.
"""

import re
from datetime import date
from decimal import Decimal
from pathlib import Path

from app.core.config import settings
from app.rules.catalog import RULES_CATALOG
from app.rules.context import (
    ValidationContext,
    normalize_identifier,
    normalize_text,
)
from app.rules.finding import Finding, make_finding
from app.rules.gt_catalog import DEPARTMENT_NAMES, MUNICIPALITY_TO_DEPARTMENT
from app.rules.number_words import amount_to_words

DPI_REGEX = re.compile(r"^\d{13}$")
NIT_REGEX = re.compile(r"^(\d{4,15}-?[\dkK]|CF)$", re.IGNORECASE)
JINJA_REGEX = re.compile(r"\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}")
REGISTRY_CASE_TYPES = {"COMPRAVENTA", "DONACION", "ARRENDAMIENTO"}
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


def _rule_severity(rule_id: str) -> str:
    return RULES_CATALOG[rule_id]["severity"]


def _base(path: str) -> str:
    """Último segmento de una ruta de valor, sin índices de lista."""
    tail = path.split(".")[-1]
    return re.sub(r"\[\d+\]", "", tail).lower()


def _parent(path: str) -> str:
    return path.rsplit(".", 1)[0] if "." in path else ""


def _letters_only(text: str) -> str:
    """Secuencia de letras sin palabras de relleno ni acentos (RULE-008)."""
    normalized = normalize_text(text)
    tokens = [t for t in re.findall(r"[A-Z]+", normalized) if t not in _FILLER_WORDS]
    return "".join(tokens)


# ---------------------------------------------------------------------------
# Validaciones estructurales (sintácticas)
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Consistencia cruzada contra la ficha maestra del cliente
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Fechas y montos
# ---------------------------------------------------------------------------


def rule_007_dates(ctx: ValidationContext) -> list[Finding]:
    """Fechas futuras prohibidas y rangos inicio/fin coherentes."""
    findings: list[Finding] = []
    boundaries: dict[str, dict[str, tuple[date, str]]] = {}

    for resolved in ctx.find_fields(attr="fecha"):
        base = _base(resolved.field_key)
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
        parent = _parent(resolved.field_key)
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
        if any(hint in _base(v.field_key) for hint in _LETTERS_HINTS)
    ]
    for resolved in all_values:
        base = _base(resolved.field_key)
        if not any(hint in base for hint in _CURRENCY_HINTS):
            continue
        if any(hint in base for hint in _LETTERS_HINTS):
            continue
        amount = resolved.as_decimal()
        if amount is None or amount < 0:
            continue
        parent = _parent(resolved.field_key)
        sibling = next(
            (
                lf
                for lf in letter_fields
                if _parent(lf.field_key) == parent
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


# ---------------------------------------------------------------------------
# Datos registrales del inmueble (RGP Guatemala)
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Coherencia geográfica
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Secuencia de cláusulas e incisos
# ---------------------------------------------------------------------------


def _extract_ordinal(sub_path: str, value: str) -> int | None:
    """Ordinal de un inciso: campo numérico, palabra ordinal o número inicial."""
    base = _base(sub_path)
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
            if _base(r.field_key) in {"numero", "orden", "indice", "inciso"}
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


# ---------------------------------------------------------------------------
# Residuos de plantilla, cálculos, archivos y duplicados
# ---------------------------------------------------------------------------


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


def rule_018_percentage_sum(ctx: ValidationContext) -> list[Finding]:
    """Porcentajes de aportación societaria deben sumar 100% (Código de Comercio)."""
    findings: list[Finding] = []
    lists: dict[str, Decimal] = {}
    for list_path, items in ctx.find_list_items(["socio", "accionista", "aportacion"]):
        list_name = list_path.rsplit("[", 1)[0]
        for resolved in items:
            if "porcentaje" not in _base(resolved.field_key):
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


# Orden oficial de ejecución del motor.
RULE_FUNCTIONS = [
    rule_001_required,
    rule_002_dpi_format,
    rule_003_nit_format,
    rule_004_dpi_consistency,
    rule_005_nit_consistency,
    rule_006_name_consistency,
    rule_007_dates,
    rule_008_amount_letters,
    rule_009_finca,
    rule_010_folio,
    rule_011_libro,
    rule_012_department,
    rule_013_municipality,
    rule_014_015_016_clauses,
    rule_017_placeholders,
    rule_018_percentage_sum,
    rule_019_attachments,
    rule_020_duplicates,
]
