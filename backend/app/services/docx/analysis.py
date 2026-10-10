"""Extracción Jinja2, inferencia de campos y verificación de variables residuales."""

import re
from dataclasses import dataclass, field
from pathlib import Path

from docx import Document
from fastapi import HTTPException

RE_VARIABLE = re.compile(r"\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}")


RE_LOOP = re.compile(r"\{%\s*for\s+(\w+)\s+in\s+([a-zA-Z0-9_]+)\s*%\}")


RE_CONDITIONAL = re.compile(r"\{%\s*if\s+([a-zA-Z0-9_\.]+)\s*%\}")


@dataclass
class JinjaExtraction:
    """Variables detectadas en el documento, en orden de primera aparición."""

    variables: list[str] = field(default_factory=list)
    loops: list[dict[str, str]] = field(default_factory=list)
    conditionals: list[str] = field(default_factory=list)

    def loop_item_prefixes(self) -> list[str]:
        return [loop["item"] for loop in self.loops]


def _iter_document_text(document: Document) -> list[str]:
    """Texto de párrafos y celdas de tablas (incluidas tablas anidadas)."""
    chunks: list[str] = []

    def visit_tables(tables) -> None:
        for table in tables:
            for row in table.rows:
                for cell in row.cells:
                    chunks.extend(p.text for p in cell.paragraphs)
                    visit_tables(cell.tables)

    chunks.extend(p.text for p in document.paragraphs)
    visit_tables(document.tables)
    return chunks


def extract_jinja_variables(path: Path) -> JinjaExtraction:
    """Detecta variables {{ ... }}, bucles {% for %} y condiciones {% if %}."""
    try:
        document = Document(str(path))
    except Exception as exc:
        raise HTTPException(422, "No se pudo abrir el DOCX para su análisis.") from exc

    extraction = JinjaExtraction()
    seen_vars: set[str] = set()
    seen_loops: set[str] = set()
    seen_ifs: set[str] = set()

    for text in _iter_document_text(document):
        for match in RE_VARIABLE.finditer(text):
            var = match.group(1)
            if var not in seen_vars:
                seen_vars.add(var)
                extraction.variables.append(var)
        for match in RE_LOOP.finditer(text):
            item, collection = match.group(1), match.group(2)
            if collection not in seen_loops:
                seen_loops.add(collection)
                extraction.loops.append({"item": item, "collection": collection})
        for match in RE_CONDITIONAL.finditer(text):
            var = match.group(1)
            if var not in seen_ifs:
                seen_ifs.add(var)
                extraction.conditionals.append(var)
    return extraction


def find_residual_variables(path: Path) -> list[str]:
    """Variables {{ ... }} que persisten tras el render (RULE-017)."""
    document = Document(str(path))
    residuals: list[str] = []
    seen: set[str] = set()
    for text in _iter_document_text(document):
        for match in RE_VARIABLE.finditer(text):
            var = match.group(1)
            if var not in seen:
                seen.add(var)
                residuals.append(var)
    return residuals


_CURRENCY_HINTS = (
    "precio",
    "monto",
    "total",
    "honorario",
    "renta",
    "capital",
    "valor",
    "pago",
    "saldo",
    "deposito",
)


_DATE_HINTS = ("fecha", "vencimiento")


_TEXTAREA_HINTS = ("direccion", "observacion", "descripcion", "clausula", "texto")


_NAME_HINTS = ("nombre", "razon_social", "apellido", "compareciente")


_ACRONYMS = {"dpi", "nit", "cui", "s.a.", "sa"}


def suggest_field_type(variable: str) -> str:
    """Heurística de tipo según el nombre de la variable Jinja2."""
    name = variable.lower()
    if "dpi" in name or "cui" in name:
        return "dpi"
    if "nit" in name:
        return "nit"
    if "correo" in name or "email" in name:
        return "email"
    if "telefono" in name or "phone" in name:
        return "phone"
    if any(hint in name for hint in _DATE_HINTS):
        return "date"
    if "porcentaje" in name or "percent" in name:
        return "percentage"
    if any(hint in name for hint in _CURRENCY_HINTS):
        return "currency"
    if any(hint in name for hint in _NAME_HINTS):
        return "name"
    if any(hint in name for hint in _TEXTAREA_HINTS):
        return "textarea"
    return "text"


def humanize_label(variable: str) -> str:
    """Etiqueta legible: 'comprador.dpi' -> 'Comprador - DPI'."""
    parts = [segment.replace("_", " ").strip() for segment in variable.split(".")]
    humanized: list[str] = []
    for part in parts:
        words = [
            word.upper() if word.lower() in _ACRONYMS else word.capitalize()
            for word in part.split()
            if word
        ]
        humanized.append(" ".join(words))
    return " - ".join(p for p in humanized if p)[:150] or variable[:150]
