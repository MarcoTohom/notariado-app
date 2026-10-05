from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.schemas.dynamic_field import FieldDefinition
from app.services.field_validation import (
    calculate,
    check_definitions,
    comparison_name,
    scalar,
    validate_values,
)


def field(kind="text", key="value", **kwargs):
    return FieldDefinition(key=key, label=key, field_type=kind, **kwargs)


@pytest.mark.parametrize(
    "kind,value,expected,options",
    [
        ("text", "  dos   palabras ", "dos palabras", {}),
        ("textarea", "  línea\nsegunda  ", "línea\nsegunda", {}),
        ("name", " María  de la Peña ", "María de la Peña", {}),
        ("dpi", "0000 00000 0101", "0000000000101", {}),
        ("nit", "00123-k", "00123K", {}),
        ("phone", "+502 (5555)-0101", "+50255550101", {}),
        ("email", " SINTETICO@EXAMPLE.COM ", "sintetico@example.com", {}),
        ("integer", "12", 12, {}),
        ("decimal", "0.123456789012", "0.123456789012", {}),
        ("currency", "999999999999999999.01", "999999999999999999.01", {}),
        ("percentage", "100", "100", {}),
        ("date", "2024-02-29", "2024-02-29", {}),
        ("datetime", "2026-10-04T13:45", "2026-10-04T13:45:00", {}),
        ("boolean", False, False, {}),
        (
            "select",
            "a",
            "a",
            {"options_json": {"choices": [{"label": "A", "value": "a"}]}},
        ),
        (
            "richtext",
            '<p onclick="alert(1)">Hola <strong>sí</strong><img src=x onerror=x></p>',
            "<p>Hola <strong>sí</strong></p>",
            {},
        ),
    ],
)
def test_scalar_types(kind, value, expected, options):
    assert scalar(field(kind, **options), value) == expected


@pytest.mark.parametrize(
    "kind,value,options",
    [
        ("dpi", 1234567890101, {}),
        ("dpi", "000000000000", {}),
        ("dpi", "١٢٣٤٥٦٧٨٩٠١٢٣", {}),
        ("nit", 123456, {}),
        ("nit", "12-X", {}),
        ("name", "Persona 123", {}),
        ("phone", "123", {}),
        ("email", "correo-invalido", {}),
        ("integer", "1.1", {}),
        ("integer", True, {}),
        ("integer", "9007199254740992", {}),
        ("decimal", 0.1, {}),
        ("currency", "1.001", {}),
        ("currency", "-0.01", {"min_value": "0"}),
        ("decimal", "NaN", {}),
        ("decimal", "1e99", {}),
        ("percentage", "100.01", {}),
        ("percentage", "-1", {}),
        ("date", "2025-02-29", {}),
        ("date", "20261004", {}),
        ("date", "2026-10-01", {"min_value": "2026-10-04"}),
        ("datetime", "2026-10-04T13:00+06:00", {}),
        ("boolean", "false", {}),
        ("text", "a", {"min_length": 2}),
        ("textarea", "abc", {"max_length": 2}),
        ("text", "123", {"regex": "[A-Z]+"}),
        (
            "select",
            "b",
            {
                "options_json": {
                    "choices": [{"value": "b", "label": "B", "active": False}]
                }
            },
        ),
    ],
)
def test_scalar_invalid(kind, value, options):
    with pytest.raises(ValueError):
        scalar(field(kind, **options), value)


def test_fixed_precision_calculations_and_dependencies():
    assert calculate("0.1 + 0.2", {}) == "0.30"
    assert (
        calculate(
            "precio * porcentaje / 100",
            {"precio": "123456789012345.67", "porcentaje": "12"},
        )
        == "14814814681481.48"
    )
    assert (
        calculate(
            "suma(items.monto)", {"items": [{"monto": "0.10"}, {"monto": "0.20"}]}
        )
        == "0.30"
    )
    defs = [
        field("currency", "precio"),
        field("computed", "doble", calculation_expression="total * 2"),
        field("computed", "total", calculation_expression="precio + 0.1"),
    ]
    check_definitions(defs)
    result = validate_values(defs, {"precio": "0.20", "total": "9999"})
    assert not result.errors
    assert result.values == {"precio": "0.20", "total": "0.30", "doble": "0.60"}
    with pytest.raises(ValueError, match="cero"):
        calculate("1 / 0", {})


@pytest.mark.parametrize(
    "expression",
    [
        "__import__('os')",
        "a.__class__",
        "a[0]",
        "2 ** 999",
        "[1,2]",
        "sum(a)",
        "open(a)",
        "'x'",
        "True",
    ],
)
def test_unsafe_calculations_rejected(expression):
    with pytest.raises(ValueError):
        field("computed", calculation_expression=expression)


@pytest.mark.parametrize(
    "options",
    [
        {"min_length": 3, "max_length": 2},
        {"regex": "(a+)+"},
        {"regex": "["},
        {"field_type": "currency", "min_value": "NaN"},
        {"field_type": "currency", "min_value": "hello"},
        {"field_type": "percentage", "min_value": "10", "max_value": "1"},
        {"field_type": "relation"},
        {"field_type": "list"},
        {"field_type": "select"},
        {"label": "   "},
        {"mask": "<script>"},
        {"key": "constructor"},
    ],
)
def test_bad_configuration(options):
    payload = {"key": "a", "label": "A", "field_type": "text", **options}
    with pytest.raises(ValidationError):
        FieldDefinition(**payload)


def test_bad_graphs():
    with pytest.raises(ValueError, match="ciclo"):
        check_definitions(
            [
                field("computed", "a", calculation_expression="b"),
                field("computed", "b", calculation_expression="a"),
            ]
        )
    with pytest.raises(ValueError, match="inexistente"):
        check_definitions(
            [field("computed", "a", calculation_expression="missing + 1")]
        )
    with pytest.raises(ValueError, match="repetirse"):
        check_definitions([field(), field()])
    with pytest.raises(ValueError, match="mismo tipo"):
        check_definitions(
            [
                field("date", "fecha", options_json={"compare_to": "texto"}),
                field("text", "texto"),
            ]
        )
    with pytest.raises(ValueError, match="numéricos"):
        check_definitions(
            [
                field("text", "texto"),
                field("computed", "total", calculation_expression="texto + 1"),
            ]
        )


def test_lists_required_null_unknown_and_dates():
    defs = [
        field(
            "list",
            "bienes",
            required=True,
            options_json={
                "fields": [field("currency", "valor", min_value="0").model_dump()]
            },
        ),
        field("text", "required", required=True),
        field("boolean", "ok", required=True),
        field("text", "locked", readonly=True, default_value="Fijo"),
        field("date", "inicio"),
        field("date", "fin", options_json={"compare_to": "inicio"}),
    ]
    result = validate_values(
        defs,
        {
            "bienes": [{"valor": "-1"}],
            "ok": False,
            "required": None,
            "locked": "Forjado",
            "inicio": "2026-10-04",
            "fin": "2026-10-03",
            "extra": "x",
        },
    )
    assert {e.path for e in result.errors} == {
        "bienes.0.valor",
        "required",
        "fin",
        "extra",
    }
    assert result.values["locked"] == "Fijo"
    assert result.values["ok"] is False
    assert comparison_name("  MARÍA  de la Peña ") == comparison_name(
        "María de la Peña"
    )


def test_relation_and_file_validate_with_authoritative_resolvers():
    definitions = [
        field(
            "relation",
            "cliente",
            source="clients",
            options_json={"autofill": {"dpi": "dpi", "direccion": "address"}},
        ),
        field("dpi", "dpi", readonly=True),
        field("text", "direccion"),
        field("file", "archivo"),
    ]
    check_definitions(definitions)
    resolved = []

    def relation(source, value):
        assert source == "clients" and value == "client-id"
        return SimpleNamespace(dpi="0000000000101", address="Dirección sintética")

    def attachment(value, path, definition):
        resolved.append((value, path, definition.field_type))

    result = validate_values(
        definitions,
        {"cliente": "client-id", "dpi": "1111111111111", "archivo": "file-id"},
        relation=relation,
        attachment=attachment,
    )
    assert not result.errors
    assert result.values["dpi"] == "0000000000101"
    assert result.values["direccion"] == "Dirección sintética"
    assert resolved == [("file-id", "archivo", "file")]


def test_readonly_relation_cannot_be_used_to_forge_autofill():
    definitions = [
        field(
            "relation",
            "cliente",
            source="clients",
            readonly=True,
            options_json={"autofill": {"dpi": "dpi"}},
        ),
        field("dpi", "dpi"),
    ]
    calls = []

    def lookup(source, value):
        calls.append(value)
        return SimpleNamespace(dpi="0000000000101")

    result = validate_values(
        definitions,
        {"cliente": "forged", "dpi": "1111111111111"},
        previous={"cliente": "original"},
        relation=lookup,
    )
    assert not result.errors
    assert set(calls) == {"original"}
    assert result.values == {"cliente": "original", "dpi": "0000000000101"}


@pytest.mark.parametrize("pattern", [r"a{999999999}", r"a{0,100}a{0,100}", r"\Aabc\Z"])
def test_nonportable_or_expensive_patterns_rejected(pattern):
    with pytest.raises(ValueError):
        field(regex=pattern)
