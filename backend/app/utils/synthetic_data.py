"""Generador del corpus experimental: 100 casos sintéticos estratificados.

- 20 casos por tipo de escritura (COMPRAVENTA, DONACION, ARRENDAMIENTO,
  MATRIMONIO, SOCIEDAD).
- 10 casos íntegros + 10 con una anomalía deliberada cada uno, con los
  hallazgos esperados registrados (permite medir errores detectados/omitidos).
- Todos los datos son 100% sintéticos (Faker es_ES + reglas deterministas);
  jamás se usan datos personales reales (tesis_escrituras_context.md §4).
"""

import random
from datetime import date, timedelta
from decimal import Decimal

from faker import Faker

from app.rules.number_words import amount_to_words

CORPUS_SEED = 2026
CASE_TYPES = ["COMPRAVENTA", "DONACION", "ARRENDAMIENTO", "MATRIMONIO", "SOCIEDAD"]
CASES_PER_TYPE = 20
ANOMALOUS_PER_TYPE = 10

_GT_DEPARTMENTS = [
    ("GUATEMALA", "GUATEMALA"),
    ("GUATEMALA", "MIXCO"),
    ("GUATEMALA", "VILLA NUEVA"),
    ("SACATEPEQUEZ", "ANTIGUA GUATEMALA"),
    ("QUETZALTENANGO", "QUETZALTENANGO"),
    ("ESCUINTLA", "ESCUINTLA"),
    ("ALTA VERAPAZ", "COBAN"),
    ("PETEN", "FLORES"),
    ("ZACAPA", "ZACAPA"),
    ("CHIMALTENANGO", "CHIMALTENANGO"),
]

GT_DATE = date(2026, 9, 15)


def make_faker() -> Faker:
    faker = Faker("es_ES")
    Faker.seed(CORPUS_SEED)
    random.seed(CORPUS_SEED)
    return faker


def synthetic_dpi(rng: random.Random) -> str:
    """DPI sintético de 13 dígitos (formato válido, jamás un CUI real)."""
    return "9" + "".join(rng.choice("0123456789") for _ in range(12))


def synthetic_nit(rng: random.Random) -> str:
    return f"{rng.randint(4000000, 9999999)}-{rng.randint(0, 9)}"


def synthetic_person(faker: Faker, rng: random.Random) -> dict:
    first = faker.first_name()
    last = f"{faker.last_name()} {faker.last_name()}"
    return {
        "first_name": first,
        "last_name": last,
        "full_name": f"{first} {last}",
        "dpi": synthetic_dpi(rng),
        "nit": synthetic_nit(rng),
    }


def synthetic_amount(
    rng: random.Random, low: int = 50000, high: int = 900000
) -> Decimal:
    return Decimal(rng.randrange(low, high, 5000))


def _money_pair(rng: random.Random) -> tuple[str, str]:
    amount = synthetic_amount(rng)
    return str(amount), amount_to_words(amount)


def _clauses(count: int = 4) -> list[dict]:
    ordinals = ["PRIMERA", "SEGUNDA", "TERCERA", "CUARTA", "QUINTA"]
    return [
        {"numero": i + 1, "texto": f"{ordinals[i]}: cláusula sintética de prueba."}
        for i in range(count)
    ]


# ---------------------------------------------------------------------------
# Definiciones de formulario por tipo de escritura
# ---------------------------------------------------------------------------


def _f(key: str, label: str, field_type: str, required: bool = False) -> dict:
    return {
        "key": key,
        "label": label,
        "field_type": field_type,
        "required": required,
        "options_json": {},
        "source": "manual",
    }


def _list_field(key: str, label: str, subfields: list[dict]) -> dict:
    field = _f(key, label, "list")
    field["options_json"] = {"fields": subfields}
    return field


FORM_FIELDS: dict[str, list[dict]] = {
    "COMPRAVENTA": [
        _f("comprador_dpi", "DPI del Comprador", "dpi", required=True),
        _f("comprador_nombre", "Nombre del Comprador", "name", required=True),
        _f("vendedor_dpi", "DPI del Vendedor", "dpi"),
        _f("vendedor_nombre", "Nombre del Vendedor", "name"),
        _f("precio_inmueble", "Precio del Inmueble", "currency"),
        _f("precio_letras", "Precio en Letras", "text"),
        _f("finca_registral", "Finca Registral", "text"),
        _f("folio_registral", "Folio Registral", "text"),
        _f("libro_registral", "Libro Registral", "text"),
        _f("departamento_inmueble", "Departamento del Inmueble", "text"),
        _f("municipio_inmueble", "Municipio del Inmueble", "text"),
        _f("fecha_escritura", "Fecha de la Escritura", "date"),
        _list_field(
            "clausulas",
            "Cláusulas",
            [_f("numero", "Número", "integer"), _f("texto", "Texto", "text")],
        ),
    ],
    "DONACION": [
        _f("donante_dpi", "DPI del Donante", "dpi", required=True),
        _f("donante_nombre", "Nombre del Donante", "name", required=True),
        _f("donatario_dpi", "DPI del Donatario", "dpi"),
        _f("donatario_nombre", "Nombre del Donatario", "name"),
        _f("valor_estimado", "Valor Estimado", "currency"),
        _f("valor_letras", "Valor en Letras", "text"),
        _f("finca_registral", "Finca Registral", "text"),
        _f("folio_registral", "Folio Registral", "text"),
        _f("libro_registral", "Libro Registral", "text"),
        _f("departamento_inmueble", "Departamento del Inmueble", "text"),
        _f("municipio_inmueble", "Municipio del Inmueble", "text"),
        _f("fecha_escritura", "Fecha de la Escritura", "date"),
        _list_field(
            "clausulas",
            "Cláusulas",
            [_f("numero", "Número", "integer"), _f("texto", "Texto", "text")],
        ),
    ],
    "ARRENDAMIENTO": [
        _f("arrendador_dpi", "DPI del Arrendador", "dpi", required=True),
        _f("arrendador_nombre", "Nombre del Arrendador", "name", required=True),
        _f("arrendatario_dpi", "DPI del Arrendatario", "dpi"),
        _f("arrendatario_nombre", "Nombre del Arrendatario", "name"),
        _f("renta_mensual", "Renta Mensual", "currency"),
        _f("renta_letras", "Renta en Letras", "text"),
        _f("finca_registral", "Finca Registral", "text"),
        _f("folio_registral", "Folio Registral", "text"),
        _f("libro_registral", "Libro Registral", "text"),
        _f("departamento_inmueble", "Departamento del Inmueble", "text"),
        _f("municipio_inmueble", "Municipio del Inmueble", "text"),
        _f("fecha_inicio", "Fecha de Inicio", "date"),
        _f("fecha_fin", "Fecha de Finalización", "date"),
    ],
    "MATRIMONIO": [
        _f("contrayente_uno_dpi", "DPI del Primer Contrayente", "dpi", required=True),
        _f("contrayente_uno_nombre", "Primer Contrayente", "name", required=True),
        _f("contrayente_dos_dpi", "DPI del Segundo Contrayente", "dpi"),
        _f("contrayente_dos_nombre", "Segundo Contrayente", "name"),
        _f("fecha_matrimonio", "Fecha del Matrimonio", "date"),
        _f("fecha_escritura", "Fecha de Protocolización", "date"),
        _f("departamento_registro", "Departamento del Registro", "text"),
        _f("municipio_registro", "Municipio del Registro", "text"),
        _f("observaciones", "Observaciones", "textarea"),
    ],
    "SOCIEDAD": [
        _f("denominacion", "Denominación Social", "text", required=True),
        _f("capital_monto", "Capital Social", "currency"),
        _f("capital_letras", "Capital en Letras", "text"),
        _f("representante_dpi", "DPI del Representante", "dpi", required=True),
        _f("representante_nombre", "Nombre del Representante", "name", required=True),
        _f("departamento_sociedad", "Departamento de la Sociedad", "text"),
        _f("municipio_sociedad", "Municipio de la Sociedad", "text"),
        _f("fecha_escritura", "Fecha de Constitución", "date"),
        _f("observaciones", "Observaciones", "textarea"),
        _list_field(
            "socios",
            "Socios y Aportaciones",
            [
                _f("socio_nombre", "Nombre del Socio", "name"),
                _f("socio_dpi", "DPI del Socio", "dpi"),
                _f("socio_porcentaje", "Porcentaje de Aportación", "percentage"),
            ],
        ),
    ],
}

# Roles comparecientes por tipo: (rol, cantidad).
PARTY_ROLES: dict[str, list[str]] = {
    "COMPRAVENTA": ["COMPRADOR", "VENDEDOR"],
    "DONACION": ["DONANTE", "DONATARIO"],
    "ARRENDAMIENTO": ["ARRENDADOR", "ARRENDATARIO"],
    "MATRIMONIO": ["CONTRAYENTE", "CONTRAYENTE"],
    "SOCIEDAD": ["REPRESENTANTE_LEGAL", "SOCIO", "SOCIO"],
}

_ROLE_VALUE_PREFIX = {
    "COMPRADOR": "comprador",
    "VENDEDOR": "vendedor",
    "DONANTE": "donante",
    "DONATARIO": "donatario",
    "ARRENDADOR": "arrendador",
    "ARRENDATARIO": "arrendatario",
    "REPRESENTANTE_LEGAL": "representante",
}


# ---------------------------------------------------------------------------
# Valores íntegros por tipo
# ---------------------------------------------------------------------------


def build_clean_values(case_type: str, persons: list[dict], rng: random.Random) -> dict:
    """Valores consistentes que NO disparan ninguna regla del motor."""
    dept, muni = _GT_DEPARTMENTS[rng.randrange(len(_GT_DEPARTMENTS))]
    amount, letters = _money_pair(rng)
    escritura = GT_DATE.isoformat()
    registry = {
        "finca_registral": str(rng.randint(10000, 99999)),
        "folio_registral": str(rng.randint(100, 999)),
        "libro_registral": str(rng.randint(1, 99)),
    }

    if case_type == "COMPRAVENTA":
        return {
            "comprador_dpi": persons[0]["dpi"],
            "comprador_nombre": persons[0]["full_name"],
            "vendedor_dpi": persons[1]["dpi"],
            "vendedor_nombre": persons[1]["full_name"],
            "precio_inmueble": amount,
            "precio_letras": letters,
            **registry,
            "departamento_inmueble": dept,
            "municipio_inmueble": muni,
            "fecha_escritura": escritura,
            "clausulas": _clauses(),
        }
    if case_type == "DONACION":
        return {
            "donante_dpi": persons[0]["dpi"],
            "donante_nombre": persons[0]["full_name"],
            "donatario_dpi": persons[1]["dpi"],
            "donatario_nombre": persons[1]["full_name"],
            "valor_estimado": amount,
            "valor_letras": letters,
            **registry,
            "departamento_inmueble": dept,
            "municipio_inmueble": muni,
            "fecha_escritura": escritura,
            "clausulas": _clauses(),
        }
    if case_type == "ARRENDAMIENTO":
        return {
            "arrendador_dpi": persons[0]["dpi"],
            "arrendador_nombre": persons[0]["full_name"],
            "arrendatario_dpi": persons[1]["dpi"],
            "arrendatario_nombre": persons[1]["full_name"],
            "renta_mensual": amount,
            "renta_letras": letters,
            **registry,
            "departamento_inmueble": dept,
            "municipio_inmueble": muni,
            "fecha_inicio": "2026-01-01",
            "fecha_fin": "2026-12-31",
        }
    if case_type == "MATRIMONIO":
        return {
            "contrayente_uno_dpi": persons[0]["dpi"],
            "contrayente_uno_nombre": persons[0]["full_name"],
            "contrayente_dos_dpi": persons[1]["dpi"],
            "contrayente_dos_nombre": persons[1]["full_name"],
            "fecha_matrimonio": "2026-08-15",
            "fecha_escritura": escritura,
            "departamento_registro": dept,
            "municipio_registro": muni,
            "observaciones": "Acta sintética para el experimento UMG.",
        }
    if case_type == "SOCIEDAD":
        return {
            "denominacion": f"Inversiones {rng.choice(['Altiplano', 'Pacífico', 'Central'])} {rng.randint(100, 999)}, S.A.",
            "capital_monto": amount,
            "capital_letras": letters,
            "representante_dpi": persons[0]["dpi"],
            "representante_nombre": persons[0]["full_name"],
            "departamento_sociedad": dept,
            "municipio_sociedad": muni,
            "fecha_escritura": escritura,
            "observaciones": "Acta constitutiva sintética para el experimento UMG.",
            "socios": [
                {
                    "socio_nombre": persons[1]["full_name"],
                    "socio_dpi": persons[1]["dpi"],
                    "socio_porcentaje": "60",
                },
                {
                    "socio_nombre": persons[2]["full_name"],
                    "socio_dpi": persons[2]["dpi"],
                    "socio_porcentaje": "40",
                },
            ],
        }
    raise ValueError(f"Tipo de escritura no soportado: {case_type}")


# ---------------------------------------------------------------------------
# Inyección de anomalías deliberadas
# ---------------------------------------------------------------------------


def _first_role_key(case_type: str, attr: str) -> str:
    """Clave del primer compareciente para un atributo (comprador_dpi, etc.)."""
    prefix = {
        "COMPRAVENTA": "comprador",
        "DONACION": "donante",
        "ARRENDAMIENTO": "arrendador",
        "MATRIMONIO": "contrayente_uno",
        "SOCIEDAD": "representante",
    }[case_type]
    return f"{prefix}_{attr}"


def _amount_key(case_type: str) -> tuple[str, str] | None:
    return {
        "COMPRAVENTA": ("precio_inmueble", "precio_letras"),
        "DONACION": ("valor_estimado", "valor_letras"),
        "ARRENDAMIENTO": ("renta_mensual", "renta_letras"),
        "SOCIEDAD": ("capital_monto", "capital_letras"),
    }.get(case_type)


def inject_anomaly(
    values: dict, anomaly_rule: str, case_type: str, rng: random.Random
) -> tuple[dict, list[str]]:
    """Muta los valores íntegros inyectando la anomalía indicada.

    Devuelve (valores_mutados, hallazgos_esperados). Las anomalías están
    diseñadas para disparar exactamente las reglas esperadas (y nada más).
    """
    values = dict(values)
    expected = [anomaly_rule]

    if anomaly_rule == "RULE-001":
        values[_first_role_key(case_type, "dpi")] = ""
    elif anomaly_rule == "RULE-002":
        # DPI malformado: también difiere de la ficha (RULE-004 en cascada).
        values[_first_role_key(case_type, "dpi")] = "12345"
        expected = ["RULE-002", "RULE-004"]
    elif anomaly_rule == "RULE-003":
        # NIT con formato inválido: también dispara RULE-005 porque el valor
        # no puede coincidir con el NIT de la ficha del cliente.
        nit_field = f"{_first_role_key(case_type, 'dpi')[:-4]}_nit"
        values[nit_field] = "ABC-99"
        expected = ["RULE-003", "RULE-005"]
    elif anomaly_rule == "RULE-004":
        current = values[_first_role_key(case_type, "dpi")]
        values[_first_role_key(case_type, "dpi")] = current[:-1] + (
            "1" if current[-1] != "1" else "2"
        )
    elif anomaly_rule == "RULE-005":
        nit_field = _first_role_key(case_type, "dpi")[:-4] + "_nit"
        values[nit_field] = "9999999-9"
    elif anomaly_rule == "RULE-006":
        values[_first_role_key(case_type, "nombre")] = "Nombre Completamente Distinto"
    elif anomaly_rule == "RULE-007":
        if case_type == "ARRENDAMIENTO":
            values["fecha_inicio"] = "2026-12-31"
            values["fecha_fin"] = "2026-01-01"
        else:
            values["fecha_escritura"] = (GT_DATE + timedelta(days=3650)).isoformat()
    elif anomaly_rule == "RULE-008":
        pair = _amount_key(case_type)
        if pair:
            values[pair[1]] = "NOVENTA Y NUEVE MIL QUETZALES"
    elif anomaly_rule == "RULE-009":
        values["finca_registral"] = "ABC-123"
    elif anomaly_rule == "RULE-010":
        values["folio_registral"] = "XYZ"
    elif anomaly_rule == "RULE-011":
        values["libro_registral"] = ""
    elif anomaly_rule == "RULE-012":
        geo_key = next((k for k in values if "departamento" in k), None)
        if geo_key:
            values[geo_key] = "NARNIA"
    elif anomaly_rule == "RULE-013":
        geo_key = next((k for k in values if "municipio" in k), None)
        dept_key = next((k for k in values if "departamento" in k), None)
        if geo_key and dept_key:
            values[dept_key] = "GUATEMALA"
            values[geo_key] = "COBAN"  # pertenece a ALTA VERAPAZ
            expected = ["RULE-013"]
    elif anomaly_rule == "RULE-014":
        clauses = [dict(c) for c in values.get("clausulas", _clauses())]
        clauses[2]["numero"] = 2  # duplica el inciso 2 y omite el 3
        values["clausulas"] = clauses
        expected = ["RULE-014", "RULE-015"]
    elif anomaly_rule == "RULE-015":
        clauses = [dict(c) for c in values.get("clausulas", _clauses())]
        clauses.append({"numero": 4, "texto": "CUARTA repetida."})
        values["clausulas"] = clauses
    elif anomaly_rule == "RULE-017":
        obs_key = "observaciones" if "observaciones" in values else "capital_letras"
        values[obs_key] = "Texto con residuo {{ variable_sin_sustituir }}."
    elif anomaly_rule == "RULE-018":
        socios = [dict(s) for s in values.get("socios", [])]
        if socios:
            socios[0]["socio_porcentaje"] = "80"  # 80 + 40 = 120 != 100
            values["socios"] = socios
    elif anomaly_rule == "RULE-020":
        # Se maneja duplicando el compareciente al crear el expediente.
        pass
    else:
        raise ValueError(f"Anomalía no soportada: {anomaly_rule}")
    return values, expected


# Plan de 10 anomalías por tipo de escritura (una por caso anómalo).
ANOMALY_PLAN: dict[str, list[str]] = {
    "COMPRAVENTA": [
        "RULE-004",
        "RULE-003",
        "RULE-006",
        "RULE-007",
        "RULE-008",
        "RULE-009",
        "RULE-010",
        "RULE-012",
        "RULE-014",
        "RULE-001",
    ],
    "DONACION": [
        "RULE-004",
        "RULE-005",
        "RULE-006",
        "RULE-007",
        "RULE-008",
        "RULE-009",
        "RULE-011",
        "RULE-013",
        "RULE-015",
        "RULE-001",
    ],
    "ARRENDAMIENTO": [
        "RULE-004",
        "RULE-003",
        "RULE-006",
        "RULE-007",
        "RULE-008",
        "RULE-009",
        "RULE-010",
        "RULE-012",
        "RULE-013",
        "RULE-001",
    ],
    "MATRIMONIO": [
        "RULE-004",
        "RULE-003",
        "RULE-006",
        "RULE-007",
        "RULE-012",
        "RULE-013",
        "RULE-001",
        "RULE-017",
        "RULE-002",
        "RULE-020",
    ],
    "SOCIEDAD": [
        "RULE-018",
        "RULE-003",
        "RULE-004",
        "RULE-006",
        "RULE-008",
        "RULE-012",
        "RULE-013",
        "RULE-001",
        "RULE-017",
        "RULE-002",
    ],
}
