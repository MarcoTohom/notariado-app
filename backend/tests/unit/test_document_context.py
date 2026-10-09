"""Pruebas unitarias del constructor de contexto Jinja2 (Fase 7).

Verifica el mapeo de valores planos del formulario a las variables de la
plantilla: escalares anidados (comprador.dpi), variables planas y
colecciones para bucles {% for %}.
"""

from app.models.dynamic_field import TemplateField
from app.services.docx.context import build_render_context


def make_field(
    key: str, field_type: str = "text", docx_variable: str | None = None
) -> TemplateField:
    return TemplateField(
        template_version_id="v1",
        key=key,
        label=key,
        field_type=field_type,
        options_json={},
        source="manual",
        docx_variable=docx_variable,
    )


def test_flat_values_pass_through():
    fields = [make_field("numero_escritura", "text", "numero_escritura")]
    context = build_render_context(fields, {"numero_escritura": "150"})
    assert context["numero_escritura"] == "150"


def test_dotted_variables_nest_into_dicts():
    fields = [
        make_field("comprador_dpi", "dpi", "comprador.dpi"),
        make_field("comprador_nombre", "name", "comprador.nombre"),
        make_field("vendedor_dpi", "dpi", "vendedor.dpi"),
    ]
    values = {
        "comprador_dpi": "1234567890101",
        "comprador_nombre": "Ana Lopez",
        "vendedor_dpi": "9876543210901",
    }
    context = build_render_context(fields, values)
    assert context["comprador"]["dpi"] == "1234567890101"
    assert context["comprador"]["nombre"] == "Ana Lopez"
    assert context["vendedor"]["dpi"] == "9876543210901"


def test_list_fields_map_to_collections_for_loops():
    fields = [
        make_field("testigos", "list", "testigos"),
    ]
    values = {
        "testigos": [
            {"nombre": "Testigo Uno", "dpi": "1111111111111"},
            {"nombre": "Testigo Dos", "dpi": "2222222222222"},
        ]
    }
    context = build_render_context(fields, values)
    assert len(context["testigos"]) == 2
    assert context["testigos"][0]["nombre"] == "Testigo Uno"
    assert context["testigos"][1]["dpi"] == "2222222222222"


def test_missing_values_are_omitted_not_none():
    fields = [make_field("comprador_nit", "nit", "comprador.nit")]
    context = build_render_context(fields, {})
    assert "comprador" not in context


def test_none_values_never_render_as_none_text():
    """Un None almacenado no debe llegar al contexto (Jinja2 lo imprime 'None')."""
    fields = [make_field("fecha_escritura", "date", "fecha_escritura")]
    context = build_render_context(fields, {"fecha_escritura": None})
    assert "fecha_escritura" not in context


def test_fields_without_docx_variable_keep_flat_key_only():
    fields = [make_field("observaciones", "textarea", None)]
    context = build_render_context(fields, {"observaciones": "Nota al margen"})
    assert context["observaciones"] == "Nota al margen"


def test_mixed_scalar_list_and_nested_together():
    fields = [
        make_field("numero_escritura", "text", "numero_escritura"),
        make_field("comprador_dpi", "dpi", "comprador.dpi"),
        make_field("testigos", "list", "testigos"),
    ]
    values = {
        "numero_escritura": "151",
        "comprador_dpi": "1234567890101",
        "testigos": [{"nombre": "T1"}],
    }
    context = build_render_context(fields, values)
    assert context["numero_escritura"] == "151"
    assert context["comprador"]["dpi"] == "1234567890101"
    assert context["testigos"] == [{"nombre": "T1"}]
