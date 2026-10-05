"""Deterministic validation and bounded Decimal arithmetic; never evaluates code."""
# Input-type failures are domain validation errors, collected alongside value errors.
# ruff: noqa: TRY004

import ast
import re
import unicodedata
from collections.abc import Callable
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal, DecimalException, localcontext
from html import escape
from html.parser import HTMLParser
from typing import Any

from pydantic import EmailStr, TypeAdapter, ValidationError

MAX_TEXT = 10000
NUMERIC = {"integer", "decimal", "currency", "percentage", "computed"}
CLIENT_PROPERTIES = {
    "dpi",
    "nit",
    "address",
    "phone",
    "email",
    "marital_status",
    "full_name",
}


def normalize_name(value: str) -> str:
    return " ".join(unicodedata.normalize("NFC", value).split())


def comparison_name(value: str) -> str:
    return normalize_name(value).casefold()


def validate_pattern(pattern: str) -> None:
    # Portable subset shared with JavaScript; no backtracking groups/backreferences.
    if (
        re.search(r"[()|]|\\[1-9]", pattern)
        or pattern.count("+") + pattern.count("*") > 1
    ):
        raise ValueError(
            "Use una expresión simple sin grupos, alternativas ni referencias."
        )
    try:
        re.compile(pattern, re.ASCII)
    except re.error as exc:
        raise ValueError("Expresión regular inválida.") from exc
    if re.search(r"\\[a-ce-rt-vx-zA-CE-RT-VX-Z]", pattern):
        raise ValueError("Use una expresión regular compatible con el navegador.")
    ranges = re.findall(r"\{(\d+)(?:,(\d*))?\}", pattern)
    if any(
        int(low) > MAX_TEXT or high and int(high) > MAX_TEXT for low, high in ranges
    ):
        raise ValueError("Las repeticiones no pueden superar 10000 caracteres.")
    variable_quantifiers = len(re.findall(r"(?<!\\)[+*?]|\{\d+,\d*\}", pattern))
    if variable_quantifiers > 1:
        raise ValueError("Use como máximo una repetición de longitud variable.")


class SafeMarkup(HTMLParser):
    allowed = frozenset({"b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li"})

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in self.allowed:
            self.parts.append(f"<{tag}>")

    def handle_endtag(self, tag):
        if tag in self.allowed and tag != "br":
            self.parts.append(f"</{tag}>")

    def handle_data(self, data):
        self.parts.append(escape(data))


def sanitize_richtext(value: str) -> str:
    parser = SafeMarkup()
    parser.feed(value)
    parser.close()
    return "".join(parser.parts)


def decimal_value(value: Any) -> Decimal:
    if isinstance(value, bool) or not isinstance(value, (str, int, Decimal)):
        raise ValueError(
            "Envíe el número decimal como texto, sin separadores de millares."
        )
    text = str(value).strip()
    if not re.fullmatch(r"-?\d{1,24}(?:\.\d{1,12})?", text, re.ASCII):
        raise ValueError("Número inválido (máximo 24 enteros y 12 decimales).")
    return Decimal(text)


def expression_tree(expression: str) -> ast.Expression:
    try:
        tree = ast.parse(expression, mode="eval")
    except (SyntaxError, RecursionError) as exc:
        raise ValueError("Expresión de cálculo inválida.") from exc
    nodes = list(ast.walk(tree))
    if len(nodes) > 100:
        raise ValueError("Expresión demasiado compleja.")
    allowed = (
        ast.Expression,
        ast.BinOp,
        ast.UnaryOp,
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.USub,
        ast.UAdd,
        ast.Load,
        ast.Name,
        ast.Attribute,
        ast.Constant,
        ast.Call,
    )
    calls = [n for n in nodes if isinstance(n, ast.Call)]
    for node in nodes:
        if not isinstance(node, allowed):
            raise ValueError("Solo se permiten +, -, *, / y suma(lista.campo).")
        if isinstance(node, ast.Name) and not re.fullmatch(r"[a-z][a-z0-9_]*", node.id):
            raise ValueError("Referencia de cálculo inválida.")
        if isinstance(node, ast.Attribute) and (
            not isinstance(node.value, ast.Name)
            or not re.fullmatch(r"[a-z][a-z0-9_]*", node.attr)
            or not any(node in call.args for call in calls)
        ):
            raise ValueError("Referencia de lista inválida.")
        if (
            isinstance(node, ast.Name)
            and node.id in {"sum", "suma"}
            and not any(node is call.func for call in calls)
        ):
            raise ValueError("La suma requiere una lista y un campo.")
        if isinstance(node, ast.Call) and (
            not isinstance(node.func, ast.Name)
            or node.func.id not in {"sum", "suma"}
            or len(node.args) != 1
            or node.keywords
            or not isinstance(node.args[0], ast.Attribute)
        ):
            raise ValueError("Solo se permite suma(lista.campo).")
        if isinstance(node, ast.Constant):
            decimal_value(ast.get_source_segment(expression, node))
    return tree


def expression_dependencies(expression: str) -> set[str]:
    return {
        node.id
        for node in ast.walk(expression_tree(expression))
        if isinstance(node, ast.Name) and node.id not in {"sum", "suma"}
    }


def calculate(expression: str, values: dict) -> str:
    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant):
            return decimal_value(ast.get_source_segment(expression, node))
        if isinstance(node, ast.Name):
            return decimal_value(values.get(node.id))
        if isinstance(node, ast.Call):
            ref = node.args[0]
            items = values.get(ref.value.id)
            if not isinstance(items, list):
                raise ValueError("Complete la lista fuente del cálculo.")
            return sum(
                (decimal_value(item.get(ref.attr)) for item in items), Decimal(0)
            )
        if isinstance(node, ast.UnaryOp):
            value = visit(node.operand)
            return -value if isinstance(node.op, ast.USub) else value
        if isinstance(node, ast.BinOp):
            a, b = visit(node.left), visit(node.right)
            if isinstance(node.op, ast.Add):
                return a + b
            if isinstance(node.op, ast.Sub):
                return a - b
            if isinstance(node.op, ast.Mult):
                return a * b
            if b == 0:
                raise ValueError("No se puede dividir entre cero.")
            return a / b
        raise ValueError("Expresión de cálculo inválida.")

    with localcontext() as ctx:
        ctx.prec = 80
        result = visit(expression_tree(expression))
        if not result.is_finite() or abs(result) >= Decimal("1e24"):
            raise ValueError("Resultado fuera de rango.")
        return format(result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), "f")


def check_definitions(fields, depth=0):
    if depth > 3:
        raise ValueError("Se permiten hasta tres niveles de listas.")
    keys = {f.key for f in fields}
    if len(keys) != len(fields) or keys & {"sum", "suma"}:
        raise ValueError("Las claves de campo no pueden repetirse.")
    active = {f.key: f for f in fields if f.active}
    graph = {key: set() for key in active}
    autofill_targets = set()
    variables = [f.docx_variable for f in fields if f.docx_variable]
    if len(variables) != len(set(variables)):
        raise ValueError("Las variables DOCX no pueden repetirse.")
    for f in fields:
        if f.field_type == "list":
            check_definitions(f.options_json.fields, depth + 1)
        if not f.active:
            continue
        if f.calculated:
            deps = expression_dependencies(f.calculation_expression)
            if not deps <= active.keys():
                raise ValueError(
                    "El cálculo referencia un campo inexistente o inactivo."
                )
            graph[f.key].update(deps)
            tree = expression_tree(f.calculation_expression)
            list_roots = {
                node.value.id
                for node in ast.walk(tree)
                if isinstance(node, ast.Attribute)
            }
            for dep in deps - list_roots:
                if active[dep].field_type not in NUMERIC:
                    raise ValueError("Los operandos del cálculo deben ser numéricos.")
            for node in ast.walk(tree):
                if isinstance(node, ast.Attribute):
                    parent = active[node.value.id]
                    child = next(
                        (
                            c
                            for c in parent.options_json.fields
                            if c.key == node.attr and c.active
                        ),
                        None,
                    )
                    if (
                        parent.field_type != "list"
                        or child is None
                        or child.field_type not in NUMERIC
                    ):
                        raise ValueError(
                            "La suma requiere una lista con un campo numérico activo."
                        )
        if f.source_reference:
            source = active.get(f.source_reference)
            if not source or source.field_type != "relation":
                raise ValueError(
                    "El origen debe referenciar un campo relacional activo."
                )
        if f.options_json.compare_to and f.options_json.compare_to not in active:
            raise ValueError("La comparación referencia un campo inexistente.")
        if f.options_json.compare_to:
            other = active[f.options_json.compare_to]
            if f.field_type != other.field_type or f.field_type not in NUMERIC | {
                "date",
                "datetime",
            }:
                raise ValueError("Compare campos numéricos o fechas del mismo tipo.")
        for target, prop in f.options_json.autofill.items():
            if (
                f.source != "clients"
                or f.field_type != "relation"
                or target in autofill_targets
                or prop not in CLIENT_PROPERTIES
                or target not in active
            ):
                raise ValueError("Mapeo de autocompletado inválido.")
            if active[target].field_type not in {
                "text",
                "name",
                "dpi",
                "nit",
                "textarea",
                "phone",
                "email",
                "select",
            }:
                raise ValueError("El destino de autocompletado debe ser textual.")
            graph[target].add(f.key)
            autofill_targets.add(target)
    visiting, done = set(), set()

    def walk(key):
        if key in visiting:
            raise ValueError("Hay un ciclo entre campos calculados o relacionados.")
        if key in done:
            return
        visiting.add(key)
        for dep in graph[key]:
            walk(dep)
        visiting.remove(key)
        done.add(key)

    for key in graph:
        walk(key)
    # Defaults are validated using the same scalar validator as submitted values.
    for f in fields:
        if (
            f.default_value is not None
            and f.field_type not in {"list", "relation", "file"}
            and not f.calculated
        ):
            scalar(f, f.default_value)


def scalar(f, value):
    kind = f.field_type
    if kind == "boolean":
        if type(value) is not bool:
            raise ValueError("Seleccione verdadero o falso.")
        return value
    if kind in NUMERIC:
        number = decimal_value(value)
        if kind == "integer" and number != number.to_integral_value():
            raise ValueError("Ingrese un número entero.")
        low = (
            f.min_value
            if f.min_value is not None
            else ("0" if kind == "percentage" else None)
        )
        high = (
            f.max_value
            if f.max_value is not None
            else ("100" if kind == "percentage" else None)
        )
        if (
            low is not None
            and number < Decimal(low)
            or high is not None
            and number > Decimal(high)
        ):
            raise ValueError("Valor fuera del rango permitido.")
        if kind == "integer":
            if abs(number) > 9007199254740991:
                raise ValueError("Entero fuera del rango interoperable.")
            return int(number)
        if kind in {"currency", "computed"}:
            if number.as_tuple().exponent < -2:
                raise ValueError("Use como máximo dos decimales.")
            with localcontext() as ctx:
                ctx.prec = 80
                return format(number.quantize(Decimal("0.01")), "f")
        return format(number, "f")
    if not isinstance(value, str) or len(value) > MAX_TEXT:
        raise ValueError("Ingrese texto (máximo 10000 caracteres).")
    value = unicodedata.normalize("NFC", value.strip())
    if kind in {"text", "name"}:
        value = normalize_name(value)
    if kind == "name" and any(not (c.isalpha() or c in " '-’") for c in value):
        raise ValueError(
            "El nombre solo admite letras, espacios, guiones y apóstrofes."
        )
    if kind in {"dpi", "nit", "phone"}:
        if kind == "dpi":
            value = re.sub(r"[\s-]", "", value)
            pattern = r"[0-9]{13}"
        elif kind == "nit":
            value = re.sub(r"[\s-]", "", value).upper()
            pattern = r"(?:[0-9]{1,12}[0-9K]|CF)"
        else:
            value = re.sub(r"[\s()\-]", "", value)
            pattern = r"\+?[0-9]{8,15}"
        if not re.fullmatch(pattern, value):
            raise ValueError(f"Formato de {kind.upper()} inválido.")
    if kind == "email":
        try:
            value = str(TypeAdapter(EmailStr).validate_python(value))
        except ValidationError as exc:
            raise ValueError("Correo electrónico inválido.") from exc
        if f.options_json.lowercase:
            value = value.lower()
    if kind in {"date", "datetime"}:
        try:
            if kind == "date" and not re.fullmatch(
                r"\d{4}-\d{2}-\d{2}", value, re.ASCII
            ):
                raise ValueError()
            parsed = (
                date.fromisoformat(value)
                if kind == "date"
                else datetime.fromisoformat(value)
            )
            if kind == "datetime" and (parsed.tzinfo or "T" not in value):
                raise ValueError()
        except ValueError as exc:
            raise ValueError("Fecha inválida; use formato ISO local.") from exc
        for bound, is_min in [(f.min_value, True), (f.max_value, False)]:
            if bound:
                limit = (
                    date.fromisoformat(bound)
                    if kind == "date"
                    else datetime.fromisoformat(bound)
                )
                if parsed < limit if is_min else parsed > limit:
                    raise ValueError("Fecha fuera del rango permitido.")
        value = parsed.isoformat()
    if kind == "select" and value not in {
        o.value for o in f.options_json.choices if o.active
    }:
        raise ValueError("Seleccione una opción activa del catálogo.")
    if kind == "richtext":
        value = sanitize_richtext(value)
    if f.min_length is not None and len(value) < f.min_length:
        raise ValueError("No alcanza la longitud mínima.")
    if f.max_length is not None and len(value) > f.max_length:
        raise ValueError("Supera la longitud máxima.")
    if f.regex and not re.fullmatch(f.regex, value, re.ASCII):
        raise ValueError("El valor no cumple el formato configurado.")
    return value


def validate_values(
    fields,
    supplied: dict,
    *,
    previous=None,
    relation: Callable | None = None,
    attachment: Callable | None = None,
    prefix="",
):
    """Collect safe path errors and normalized values without persisting partial input."""
    from app.schemas.dynamic_field import FieldIssue, ValidationResult

    previous = previous or {}
    result, errors = {}, []
    active = {f.key: f for f in fields if f.active}
    pending = {
        f.key: previous.get(f.key, f.default_value)
        if f.readonly and not f.calculated
        else supplied.get(f.key, f.default_value)
        for f in active.values()
    }
    for key in supplied.keys() - active.keys():
        errors.append(
            FieldIssue(path=f"{prefix}{key}", message="Campo desconocido o inactivo.")
        )
    locked = set()
    for f in active.values():
        if f.field_type == "relation" and pending.get(f.key) and relation:
            try:
                record = relation(f.source, pending[f.key])
                for target, prop in f.options_json.autofill.items():
                    pending[target] = getattr(record, prop)
                    locked.add(target)
            except ValueError as exc:
                errors.append(FieldIssue(path=f"{prefix}{f.key}", message=str(exc)))
        elif f.field_type == "relation":
            for target in f.options_json.autofill:
                pending[target] = None
                locked.add(target)
    for f in active.values():
        if f.calculated:
            continue
        path = f"{prefix}{f.key}"
        value = pending.get(f.key, f.default_value)
        if f.readonly and f.key not in locked:
            value = previous.get(f.key, f.default_value)
        if value is None or isinstance(value, str) and not value.strip():
            if f.required or not f.nullable and f.key in supplied:
                errors.append(
                    FieldIssue(
                        path=path, message="Campo obligatorio o no admite nulos."
                    )
                )
            result[f.key] = None
            continue
        try:
            if f.field_type == "list":
                if not isinstance(value, list) or len(value) > 100:
                    raise ValueError("Ingrese una lista de hasta 100 elementos.")
                if (
                    f.required
                    and not value
                    or f.min_length is not None
                    and len(value) < f.min_length
                ):
                    raise ValueError("Agregue los elementos requeridos.")
                if f.max_length is not None and len(value) > f.max_length:
                    raise ValueError("Demasiados elementos.")
                result[f.key] = []
                for i, item in enumerate(value):
                    if not isinstance(item, dict):
                        raise ValueError("Cada elemento debe ser un objeto.")
                    nested = validate_values(
                        f.options_json.fields,
                        item,
                        # List positions are reorderable; readonly children derive
                        # from their definition or relation, never a previous index.
                        previous={},
                        relation=relation,
                        attachment=attachment,
                        prefix=f"{path}.{i}.",
                    )
                    result[f.key].append(nested.values)
                    errors.extend(nested.errors)
            elif f.field_type == "relation":
                if not isinstance(value, str) or not relation:
                    raise ValueError("Seleccione un registro relacionado.")
                relation(f.source, value)
                result[f.key] = value
            elif f.field_type == "file":
                if not isinstance(value, str) or not attachment:
                    raise ValueError("Seleccione un archivo autorizado.")
                attachment(value, path, f)
                result[f.key] = value
            else:
                result[f.key] = scalar(f, value)
        except (ValueError, DecimalException) as exc:
            message = (
                str(exc) if isinstance(exc, ValueError) else "Número fuera de rango."
            )
            errors.append(FieldIssue(path=path, message=message))
    computed = {f.key: f for f in active.values() if f.calculated}
    for _ in range(len(computed)):
        for key, f in list(computed.items()):
            if expression_dependencies(f.calculation_expression) & computed.keys():
                continue
            try:
                result[key] = scalar(f, calculate(f.calculation_expression, result))
            except (ValueError, DecimalException) as exc:
                result[key] = None
                errors.append(
                    FieldIssue(
                        path=f"{prefix}{key}",
                        message=str(exc)
                        if isinstance(exc, ValueError)
                        else "Cálculo fuera de rango.",
                    )
                )
            del computed[key]
    for f in active.values():
        other = f.options_json.compare_to
        if other and result.get(f.key) is not None and result.get(other) is not None:
            a, b = result[f.key], result[other]
            if f.field_type in NUMERIC:
                a, b = decimal_value(a), decimal_value(b)
            if a < b if f.options_json.comparison == "ge" else a > b:
                errors.append(
                    FieldIssue(
                        path=f"{prefix}{f.key}",
                        message="No cumple la comparación con el otro campo.",
                    )
                )
    return ValidationResult(values=result, errors=errors)
