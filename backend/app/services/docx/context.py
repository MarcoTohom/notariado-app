"""Contextos Jinja2 de datos validados y muestras sintéticas."""

from app.models.dynamic_field import TemplateField
from app.services.docx.analysis import JinjaExtraction, suggest_field_type

_SAMPLE_BY_TYPE = {
    "dpi": "1234567890101",
    "nit": "1234567-8",
    "name": "Nombre Sintético de Prueba",
    "email": "prueba@example.com",
    "phone": "00000000",
    "date": "1 de enero de 2026",
    "currency": "0.00",
    "percentage": "0",
    "boolean": True,
    "text": "[valor de prueba]",
    "textarea": "[valor de prueba]",
    "list": "[valor de prueba]",
}


def _sample_for(variable: str) -> object:
    return _SAMPLE_BY_TYPE[suggest_field_type(variable)]


def assign_nested(context: dict, dotted: str, value: object) -> None:
    parts = dotted.split(".")
    node = context
    for part in parts[:-1]:
        existing = node.get(part)
        if not isinstance(existing, dict):
            existing = {}
            node[part] = existing
        node = existing
    node[parts[-1]] = value


def build_sample_context(extraction: JinjaExtraction) -> dict:
    """Contexto sintético para el render de prueba (nunca datos reales)."""
    context: dict = {}
    loop_items = {loop["item"]: loop for loop in extraction.loops}
    collections = {loop["collection"]: loop for loop in extraction.loops}

    for loop in extraction.loops:
        item_vars = [
            var for var in extraction.variables if var.startswith(f"{loop['item']}.")
        ]
        rows = []
        for index in range(2):  # dos elementos de muestra por lista
            row: dict = {}
            for var in item_vars:
                leaf = var.split(".", 1)[1]
                row[leaf] = _sample_for(var)
            row["indice"] = index + 1
            rows.append(row)
        context[loop["collection"]] = rows

    for variable in extraction.variables:
        parts = variable.split(".")
        if parts[0] in collections:
            continue  # ya cubierto por la colección del bucle
        if len(parts) == 1 and variable in loop_items:
            continue  # el item del bucle no existe fuera del for
        assign_nested(context, variable, _sample_for(variable))

    for variable in extraction.conditionals:
        if variable not in extraction.variables:
            assign_nested(context, variable, True)
    return context


def build_render_context(fields: list[TemplateField], values: dict) -> dict:
    """Mapea los valores planos del formulario a las variables Jinja2.

    - Variables planas se copian tal cual (compatibilidad con claves directas).
    - Los valores None se omiten: Jinja2 los imprimiría como texto "None".
    - `docx_variable` con punto (comprador.dpi) anida en diccionarios.
    - Campos lista (testigos) pasan como colecciones de filas para {% for %}.
    """
    context: dict = {key: value for key, value in values.items() if value is not None}
    for field in fields:
        if not field.docx_variable:
            continue
        value = values.get(field.key)
        if value is None:
            continue
        variable = field.docx_variable
        if field.field_type == "list":
            context[variable] = value if isinstance(value, list) else []
        elif "." in variable:
            assign_nested(context, variable, value)
        else:
            context[variable] = value
    return context
