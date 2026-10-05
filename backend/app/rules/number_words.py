"""Conversión de números a letras en español (Art. 30, Código de Notariado).

En la redacción notarial guatemalteca los números y cantidades deben
expresarse en letras; RULE-008 usa este conversor para contrastar el monto
numérico contra su redacción en el documento.
"""

from decimal import ROUND_HALF_UP, Decimal

_UNITS = [
    "",
    "UN",
    "DOS",
    "TRES",
    "CUATRO",
    "CINCO",
    "SEIS",
    "SIETE",
    "OCHO",
    "NUEVE",
]
_SPECIALS = {
    10: "DIEZ",
    11: "ONCE",
    12: "DOCE",
    13: "TRECE",
    14: "CATORCE",
    15: "QUINCE",
    16: "DIECISEIS",
    17: "DIECISIETE",
    18: "DIECIOCHO",
    19: "DIECINUEVE",
    20: "VEINTE",
    21: "VEINTIUN",
    22: "VEINTIDOS",
    23: "VEINTITRES",
    24: "VEINTICUATRO",
    25: "VEINTICINCO",
    26: "VEINTISEIS",
    27: "VEINTISIETE",
    28: "VEINTIOCHO",
    29: "VEINTINUEVE",
}
_TENS = {
    30: "TREINTA",
    40: "CUARENTA",
    50: "CINCUENTA",
    60: "SESENTA",
    70: "SETENTA",
    80: "OCHENTA",
    90: "NOVENTA",
}
_HUNDREDS = {
    100: "CIENTO",
    200: "DOSCIENTOS",
    300: "TRESCIENTOS",
    400: "CUATROCIENTOS",
    500: "QUINIENTOS",
    600: "SEISCIENTOS",
    700: "SETECIENTOS",
    800: "OCHOCIENTOS",
    900: "NOVECIENTOS",
}


def _under_thousand(number: int) -> str:
    """Convierte 0..999 a letras (sin unidad de mil)."""
    if number == 0:
        return ""
    if number == 100:
        return "CIEN"
    if number in _SPECIALS:
        return _SPECIALS[number]
    if number in _HUNDREDS:
        return _HUNDREDS[number]

    parts: list[str] = []
    hundreds = number // 100
    remainder = number % 100
    if hundreds:
        parts.append(_HUNDREDS[hundreds * 100])
    if remainder:
        if remainder in _SPECIALS:
            parts.append(_SPECIALS[remainder])
        elif remainder < 10:
            parts.append(_UNITS[remainder])
        else:
            ten = remainder // 10 * 10
            unit = remainder % 10
            parts.append(f"{_TENS[ten]} Y {_UNITS[unit]}" if unit else _TENS[ten])
    return " ".join(parts)


def int_to_words(number: int) -> str:
    """Convierte un entero (0..999,999,999) a letras en español."""
    if number < 0:
        raise ValueError("Solo se admiten cantidades no negativas.")
    if number == 0:
        return "CERO"
    if number > 999_999_999:
        raise ValueError("Cantidad fuera de rango soportado.")

    parts: list[str] = []
    millions = number // 1_000_000
    thousands = (number % 1_000_000) // 1000
    remainder = number % 1000

    if millions:
        base = _under_thousand(millions)
        parts.append("UN MILLON" if millions == 1 else f"{base} MILLONES")
    if thousands:
        parts.append("MIL" if thousands == 1 else f"{_under_thousand(thousands)} MIL")
    if remainder:
        parts.append(_under_thousand(remainder))
    return " ".join(parts)


def amount_to_words(amount: Decimal | int | str, currency: str = "QUETZALES") -> str:
    """Monto monetario completo: 'QUINIENTOS MIL QUETZALES CON 00/100'.

    Los centavos se expresan en fracción (XX/100), uso notarial habitual.
    """
    value = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if value < 0:
        raise ValueError("El monto no puede ser negativo.")
    integer_part = int(value)
    cents = int((value - integer_part) * 100)
    words = int_to_words(integer_part)
    return f"{words} {currency} CON {cents:02d}/100"
