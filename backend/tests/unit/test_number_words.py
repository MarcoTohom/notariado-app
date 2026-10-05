"""Pruebas del conversor número -> letras en español (RULE-008, Art. 30)."""

from decimal import Decimal

import pytest

from app.rules.number_words import amount_to_words, int_to_words


@pytest.mark.parametrize(
    ("number", "expected"),
    [
        (0, "CERO"),
        (5, "CINCO"),
        (11, "ONCE"),
        (16, "DIECISEIS"),
        (20, "VEINTE"),
        (21, "VEINTIUN"),
        (31, "TREINTA Y UN"),
        (45, "CUARENTA Y CINCO"),
        (99, "NOVENTA Y NUEVE"),
        (100, "CIEN"),
        (101, "CIENTO UN"),
        (115, "CIENTO QUINCE"),
        (200, "DOSCIENTOS"),
        (250, "DOSCIENTOS CINCUENTA"),
        (999, "NOVECIENTOS NOVENTA Y NUEVE"),
        (1000, "MIL"),
        (1500, "MIL QUINIENTOS"),
        (12000, "DOCE MIL"),
        (100000, "CIEN MIL"),
        (500000, "QUINIENTOS MIL"),
        (1000000, "UN MILLON"),
        (2000000, "DOS MILLONES"),
        (2500000, "DOS MILLONES QUINIENTOS MIL"),
        (
            999999999,
            "NOVECIENTOS NOVENTA Y NUEVE MILLONES NOVECIENTOS NOVENTA Y NUEVE MIL NOVECIENTOS NOVENTA Y NUEVE",
        ),
    ],
)
def test_int_to_words(number: int, expected: str):
    assert int_to_words(number) == expected


def test_int_to_words_rejects_negatives():
    with pytest.raises(ValueError):
        int_to_words(-1)


def test_amount_to_words_quetzales():
    assert (
        amount_to_words(Decimal("500000.00")) == "QUINIENTOS MIL QUETZALES CON 00/100"
    )
    assert (
        amount_to_words(Decimal("1234.56"))
        == "MIL DOSCIENTOS TREINTA Y CUATRO QUETZALES CON 56/100"
    )
    assert amount_to_words(0) == "CERO QUETZALES CON 00/100"


def test_amount_to_words_dolares():
    assert amount_to_words(Decimal(100), "DOLARES") == "CIEN DOLARES CON 00/100"


def test_amount_to_words_rejects_negative():
    with pytest.raises(ValueError):
        amount_to_words(Decimal("-0.01"))
