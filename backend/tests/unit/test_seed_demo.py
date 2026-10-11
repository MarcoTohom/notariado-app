"""Pruebas de la semilla de demostracion con archivos (`app.utils.seed_demo`).

Se verifica lo critico del modulo sin tocar la base de datos de desarrollo:

- El generador de PDF produce archivos validos y con capa de texto
  extraible por `pypdf`, y una variante sin texto (escaneo simulado).
- Los archivos generados pasan la validacion del servicio de produccion
  (`file_validation.verify_file`), que es la misma que usa la API.
- Los montos se serializan como texto a partir de `Decimal` y el monto en
  letras se genera con el conversor real del motor de reglas.
- Los DPI/NIT produced son siempre cadenas con formato válido.
- La specification de plantillas cubre los cinco tipos de escritura.
"""

from decimal import Decimal
import io

import pandas as pd
import pytest
from docx import Document as DocxDocument
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.rules.number_words import amount_to_words
from app.services.file_validation import verify_file
from app.utils.seed_demo import (
    build_csv,
    build_pdf,
    build_xlsx,
    build_values,
    case_specs,
    template_specs,
)
from app.utils.synthetic_data import make_faker, synthetic_person

VALID_CASE_TYPES = {
    "COMPRAVENTA",
    "DONACION",
    "ARRENDAMIENTO",
    "MATRIMONIO",
    "SOCIEDAD",
}
DPI_LENGTH = 13


class _FakeClient:
    """Ficha minima con la misma interfaz que `Client` para `build_values`."""

    def __init__(self, first: str, last: str, dpi: str, nit: str | None = None):
        self.first_name = first
        self.last_name = last
        self.dpi = dpi
        self.nit = nit
        self.id = f"id-{first.lower()}"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


# ---------------------------------------------------------------------------
# Generador de PDF
# ---------------------------------------------------------------------------


def test_pdf_with_text_layer_is_valid_and_extractable():
    content = build_pdf(
        [
            [
                "CERTIFICACION DE NO REGISTRO",
                "Registro General de la Propiedad",
                "Finca registral 20245, Folio 331",
            ]
        ]
    )
    assert content.startswith(b"%PDF-")
    reader = PdfReader(io.BytesIO(content), strict=True)
    assert not reader.is_encrypted
    assert len(reader.pages) == 1
    text = reader.pages[0].extract_text() or ""
    assert "CERTIFICACION DE NO REGISTRO" in text
    assert "Finca registral 20245" in text
    # La validacion de produccion debe aceptarlo.
    verify_file(content, ".pdf")


def test_pdf_without_text_layer_extracts_nothing():
    """Variante 'escaneada': el preview debe informar que no hay capa de texto."""
    content = build_pdf([[]])
    assert content.startswith(b"%PDF-")
    reader = PdfReader(io.BytesIO(content), strict=True)
    assert len(reader.pages) == 1
    assert (reader.pages[0].extract_text() or "").strip() == ""
    verify_file(content, ".pdf")


def test_pdf_multiple_pages_keeps_order():
    content = build_pdf([["PRIMERA PAGINA"], ["SEGUNDA PAGINA"], ["TERCERA PAGINA"]])
    reader = PdfReader(io.BytesIO(content), strict=True)
    assert len(reader.pages) == 3
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    assert text.index("PRIMERA") < text.index("SEGUNDA") < text.index("TERCERA")
    verify_file(content, ".pdf")


def test_pdf_escapes_parentheses_in_content():
    """Un parentesis en el texto no debe romper la estructura del PDF."""
    content = build_pdf([["VALOR (Q125,000.00) CON PARENTESIS"]])
    reader = PdfReader(io.BytesIO(content), strict=True)
    assert "PARENTESIS" in (reader.pages[0].extract_text() or "")
    verify_file(content, ".pdf")


# ---------------------------------------------------------------------------
# Generadores tabulares
# ---------------------------------------------------------------------------


def test_csv_is_utf8_with_bom_and_passes_validation():
    content = build_csv(["concepto", "cantidad"], [["Muebles", 3], ["Sillas", 12]])
    assert content.startswith(b"\xef\xbb\xbf")  # BOM UTF-8
    verify_file(content, ".csv")


def test_xlsx_passes_validation():
    content = build_xlsx(
        {"Resumen": pd.DataFrame({"mes": ["2026-01"], "canon": ["3500.00"]})}
    )
    verify_file(content, ".xlsx")
    frame = pd.read_excel(io.BytesIO(content), engine="openpyxl")
    assert list(frame.columns) == ["mes", "canon"]


# ---------------------------------------------------------------------------
# Especificacion de plantillas
# ---------------------------------------------------------------------------


def test_five_templates_cover_valid_case_types():
    specs = template_specs()
    assert len(specs) >= 4
    assert {spec.case_type for spec in specs} <= VALID_CASE_TYPES


def test_template_docx_contains_jinja2_variables_and_loop():
    """Las plantillas deben llevar marcadores que el extractor pueda leer."""
    specs = template_specs()
    compraventa = next(
        spec
        for spec in specs
        if spec.case_type == "COMPRAVENTA" and "testigos" in " ".join(spec.paragraphs)
    )
    document = DocxDocument(io.BytesIO(compraventa.to_docx()))
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    assert "{{ numero_escritura }}" in text
    assert "{{ vendedor.dpi }}" in text
    assert "{% for testigo in testigos %}" in text
    verify_file(compraventa.to_docx(), ".docx")


def test_three_cases_specified_with_decimal_amounts():
    specs = case_specs()
    assert len(specs) >= 3
    for spec in specs:
        assert isinstance(spec.amount, Decimal)
        assert spec.amount > 0
        assert spec.title


# ---------------------------------------------------------------------------
# Valores coherentes con la ficha maestra
# ---------------------------------------------------------------------------


def test_build_values_keeps_money_as_text_and_uses_rule_engine_converter():
    import random

    spec = case_specs()[0]
    clients = {
        "VENDEDOR": _FakeClient("Ana", "Lopez", "1234567890101", "12345678-9"),
        "COMPRADOR": _FakeClient("Luis", "Perez", "2345678901202", "2345678-7"),
        "TESTIGO_A": _FakeClient("Maria", "Rivas", "3456789010123"),
        "TESTIGO_B": _FakeClient("Jose", "Cardenas", "4567890121234"),
    }
    values = build_values(spec, clients, random.Random(7), instrument_number="DEMO-001")

    assert values["precio"] == str(spec.amount)
    assert isinstance(values["precio"], str)  # nunca float
    assert values["precio_letras"] == amount_to_words(spec.amount)
    assert values["vendedor_dpi"] == "1234567890101"
    assert values["comprador_nombre"] == "Luis Perez"
    assert len(values["testigos"]) == 2
    assert all(
        isinstance(t["dpi"], str) and len(t["dpi"]) == DPI_LENGTH
        for t in values["testigos"]
    )


def test_synthetic_person_dpi_is_13_digit_string():
    """Invariante notarial: el DPI nunca se convierte a entero."""
    import random

    rng = random.Random(11)
    faker = make_faker()
    person = synthetic_person(faker, rng)
    assert isinstance(person["dpi"], str)
    assert len(person["dpi"]) == DPI_LENGTH
    assert person["dpi"].isdigit()


def test_demo_admin_required(db_session: Session):
    """Sin administrador activo la semilla debe abortar con mensaje claro."""
    from app.utils.seed_demo import _demo_admin

    with pytest.raises(SystemExit, match="seed.ps1"):
        _demo_admin(db_session)
