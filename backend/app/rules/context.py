"""Contexto de validación y resolución de campos del motor de reglas.

El motor evalúa los valores almacenados del expediente (CaseFieldValues)
contra la ficha maestra de clientes (comparecientes del expediente).
Como las plantillas son libres, la correspondencia campo <-> concepto
notarial se resuelve por heurística sobre nombres de clave, docx_variable
y tipo de campo.
"""

import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, DecimalException
from typing import Any

from app.models.case import Case
from app.models.dynamic_field import TemplateField

# Tokens de rol notarial para localizar valores dentro del formulario.
ROLE_TOKENS: dict[str, list[str]] = {
    "COMPRADOR": ["comprador"],
    "VENDEDOR": ["vendedor"],
    "DONANTE": ["donante"],
    "DONATARIO": ["donatario"],
    "ARRENDADOR": ["arrendador"],
    "ARRENDATARIO": ["arrendatario"],
    "CONTRAYENTE": ["contrayente"],
    "SOCIO": ["socio", "accionista"],
    "REPRESENTANTE_LEGAL": ["representante"],
    "TESTIGO": ["testigo"],
    "INTERPRETE": ["interprete"],
}

ATTR_TOKENS = {
    "dpi": ["dpi", "cui"],
    "nit": ["nit"],
    "nombre": ["nombre", "name"],
    "fecha": ["fecha", "date"],
}


def normalize_text(value: str) -> str:
    """Mayúsculas, sin tildes, espacios colapsados (comparación notarial)."""
    text = unicodedata.normalize("NFD", value)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return " ".join(text.upper().split())


def normalize_identifier(value: str) -> str:
    """Identificadores (NIT): sin guiones ni espacios, mayúsculas."""
    return re.sub(r"[\s\-]+", "", value).upper()


@dataclass
class ResolvedValue:
    """Un valor del formulario con su ubicación trazable."""

    field_key: str
    value: Any
    location: str

    def as_text(self) -> str:
        if self.value is None:
            return ""
        if isinstance(self.value, bool):
            return "SI" if self.value else "NO"
        return str(self.value).strip()

    def as_decimal(self) -> Decimal | None:
        try:
            return Decimal(str(self.value).strip())
        except (DecimalException, ValueError, AttributeError):
            return None

    def as_date(self) -> date | None:
        if isinstance(self.value, date):
            return self.value
        try:
            return date.fromisoformat(str(self.value).strip()[:10])
        except ValueError:
            return None


@dataclass
class PartyInfo:
    """Compareciente del expediente con su cliente maestro."""

    party_id: str
    role: str
    client_id: str
    full_name: str
    dpi: str
    nit: str | None
    tokens: list[str]


@dataclass
class ValidationContext:
    """Todo lo que las reglas necesitan para evaluar un expediente."""

    case: Case
    parties: list[PartyInfo]
    fields: list[TemplateField]
    values: dict[str, Any]
    attachments: list[Any] = field(default_factory=list)
    today: date = field(default_factory=date.today)

    # -- Iteración genérica -------------------------------------------------

    def iter_values(self) -> list[ResolvedValue]:
        """Recorre el árbol de valores produciendo rutas trazables."""
        results: list[ResolvedValue] = []

        def walk(node: Any, path: str) -> None:
            if isinstance(node, dict):
                for key, child in node.items():
                    walk(child, f"{path}.{key}" if path else str(key))
            elif isinstance(node, list):
                for index, child in enumerate(node):
                    walk(child, f"{path}[{index}]")
            else:
                results.append(ResolvedValue(field_key=path, value=node, location=path))

        walk(self.values, "")
        return results

    def find_fields(
        self,
        role: str | None = None,
        attr: str | None = None,
        contains: list[str] | None = None,
    ) -> list[ResolvedValue]:
        """Localiza valores por tokens de rol, atributo o contenido de ruta.

        Coincidencia sobre la ruta del valor (normalizada) considerando el
        docx_variable y el tipo declarado del campo cuando aplica.
        """
        role_tokens = ROLE_TOKENS.get(role, []) if role else []
        attr_tokens = ATTR_TOKENS.get(attr, []) if attr else []
        contains = contains or []

        # Mapa de tipo por prefijo de ruta para campos declarados.
        type_by_key: dict[str, str] = {}
        for f in self.fields:
            type_by_key[f.key.lower()] = f.field_type
            if f.docx_variable:
                type_by_key[f.docx_variable.lower()] = f.field_type

        matches: list[ResolvedValue] = []
        for resolved in self.iter_values():
            path = resolved.field_key.lower()
            path_tokens = re.split(r"[\.\[\]_\-]+", path)
            declared = type_by_key.get(path, "")

            if role_tokens and not any(
                any(
                    token.startswith(rt) or rt.startswith(token)
                    for token in path_tokens
                )
                for rt in role_tokens
            ):
                continue
            if attr == "dpi" and declared == "dpi":
                matches.append(resolved)
                continue
            if attr == "nit" and declared == "nit":
                matches.append(resolved)
                continue
            if attr_tokens and not any(
                any(at in token for token in path_tokens) for at in attr_tokens
            ):
                continue
            if contains and not all(token in path for token in contains):
                continue
            matches.append(resolved)
        return matches

    def find_list_items(
        self, list_tokens: list[str]
    ) -> list[tuple[str, list[ResolvedValue]]]:
        """Devuelve (ruta_lista, items) para campos lista cuyo nombre contiene tokens."""
        found: list[tuple[str, list[ResolvedValue]]] = []
        for key, value in self.values.items():
            if not isinstance(value, list):
                continue
            lowered = key.lower()
            if not any(token in lowered for token in list_tokens):
                continue
            for index, item in enumerate(value):
                if not isinstance(item, dict):
                    continue
                resolved_items = [
                    ResolvedValue(
                        field_key=f"{key}[{index}].{sub}",
                        value=sub_value,
                        location=f"{key}[{index + 1}]",
                    )
                    for sub, sub_value in item.items()
                ]
                found.append((f"{key}[{index}]", resolved_items))
        return found

    def party_by_role(self, role: str) -> list[PartyInfo]:
        return [party for party in self.parties if party.role == role]
