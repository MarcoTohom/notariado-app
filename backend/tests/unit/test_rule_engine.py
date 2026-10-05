"""Pruebas unitarias del motor de reglas con contextos fabricados (sin BD).

Cada prueba construye un ValidationContext mínimo y verifica que la regla
correspondiente dispara (o no) el hallazgo esperado.
"""

from datetime import datetime as dt
from datetime import timedelta, timezone

from app.models.case import Case
from app.models.dynamic_field import TemplateField
from app.rules.context import PartyInfo, ValidationContext
from app.rules.engine import run_rules, summarize


def make_case(case_type: str = "COMPRAVENTA") -> Case:
    return Case(
        case_number="EXP-2026-00001", title="Caso de prueba", case_type=case_type
    )


def make_field(
    key: str, field_type: str = "text", required: bool = False
) -> TemplateField:
    return TemplateField(
        template_version_id="v1",
        key=key,
        label=key.replace("_", " ").title(),
        field_type=field_type,
        required=required,
        options_json={},
        source="manual",
    )


def make_party(role: str, name: str, dpi: str, nit: str | None = None) -> PartyInfo:
    return PartyInfo(
        party_id="p1",
        role=role,
        client_id="c1",
        full_name=name,
        dpi=dpi,
        nit=nit,
        tokens=[],
    )


def ctx_with(
    values: dict, parties=None, fields=None, case_type="COMPRAVENTA"
) -> ValidationContext:
    return ValidationContext(
        case=make_case(case_type),
        parties=parties or [],
        fields=fields or [],
        values=values,
    )


def rule_ids(findings) -> list[str]:
    return sorted({f.rule_id for f in findings})


# ---------------------------------------------------------------------------
# RULE-001..003 estructurales
# ---------------------------------------------------------------------------


def test_rule_001_required_field_missing():
    ctx = ctx_with({}, fields=[make_field("comprador_dpi", "dpi", required=True)])
    findings = run_rules(ctx)
    assert "RULE-001" in rule_ids(findings)


def test_rule_001_satisfied_when_value_present():
    ctx = ctx_with(
        {"comprador_dpi": "1234567890101"},
        fields=[make_field("comprador_dpi", "dpi", required=True)],
    )
    findings = run_rules(ctx)
    assert "RULE-001" not in rule_ids(findings)


def test_rule_002_rejects_malformed_dpi():
    ctx = ctx_with(
        {"comprador_dpi": "12345"}, fields=[make_field("comprador_dpi", "dpi")]
    )
    findings = run_rules(ctx)
    assert "RULE-002" in rule_ids(findings)


def test_rule_003_rejects_malformed_nit():
    ctx = ctx_with({"empresa_nit": "ABC-99"}, fields=[make_field("empresa_nit", "nit")])
    findings = run_rules(ctx)
    assert "RULE-003" in rule_ids(findings)


# ---------------------------------------------------------------------------
# RULE-004..006 consistencia contra ficha maestra
# ---------------------------------------------------------------------------


def test_rule_004_dpi_mismatch_is_critical():
    party = make_party("COMPRADOR", "Ana Lopez", "1234567890101")
    ctx = ctx_with({"comprador_dpi": "1234567890102"}, parties=[party])
    findings = run_rules(ctx)
    rule4 = [f for f in findings if f.rule_id == "RULE-004"]
    assert len(rule4) == 1
    assert rule4[0].severity == "CRITICAL"
    assert rule4[0].current_value == "1234567890102"
    assert rule4[0].expected_value == "1234567890101"


def test_rule_004_clean_when_dpi_matches():
    party = make_party("COMPRADOR", "Ana Lopez", "1234567890101")
    ctx = ctx_with({"comprador_dpi": "1234567890101"}, parties=[party])
    findings = run_rules(ctx)
    assert "RULE-004" not in rule_ids(findings)


def test_rule_005_nit_mismatch():
    party = make_party("COMPRADOR", "Ana Lopez", "1234567890101", nit="1234567-8")
    ctx = ctx_with({"comprador_nit": "9999999-9"}, parties=[party])
    findings = run_rules(ctx)
    assert "RULE-005" in rule_ids(findings)


def test_rule_006_name_mismatch_is_critical():
    party = make_party("VENDEDOR", "Maria Fernanda Lopez", "1234567890101")
    ctx = ctx_with({"vendedor_nombre": "Maria Fernanda Lopes"}, parties=[party])
    findings = run_rules(ctx)
    rule6 = [f for f in findings if f.rule_id == "RULE-006"]
    assert len(rule6) == 1
    assert rule6[0].severity == "CRITICAL"


def test_rule_006_accepts_same_words_any_order_with_tildes():
    party = make_party("VENDEDOR", "María López García", "1234567890101")
    ctx = ctx_with({"vendedor_nombre": "maria garcia lopez"}, parties=[party])
    findings = run_rules(ctx)
    assert "RULE-006" not in rule_ids(findings)


# ---------------------------------------------------------------------------
# RULE-007 fechas / RULE-008 montos
# ---------------------------------------------------------------------------


def test_rule_007_future_escritura_date():
    future = (dt.now(timezone.utc).date() + timedelta(days=30)).isoformat()
    ctx = ctx_with(
        {"fecha_escritura": future}, fields=[make_field("fecha_escritura", "date")]
    )
    findings = run_rules(ctx)
    assert "RULE-007" in rule_ids(findings)


def test_rule_007_inverted_range():
    ctx = ctx_with(
        {"fecha_inicio": "2026-12-01", "fecha_fin": "2026-01-01"},
        fields=[make_field("fecha_inicio", "date"), make_field("fecha_fin", "date")],
    )
    findings = run_rules(ctx)
    messages = [f.message for f in findings if f.rule_id == "RULE-007"]
    assert any("plazo invertido" in m for m in messages)


def test_rule_008_amount_matches_letters():
    ctx = ctx_with(
        {"precio": "500000", "precio_letras": "QUINIENTOS MIL QUETZALES"},
        fields=[make_field("precio", "currency"), make_field("precio_letras")],
    )
    findings = run_rules(ctx)
    assert "RULE-008" not in rule_ids(findings)


def test_rule_008_amount_mismatch_reports_expected_words():
    ctx = ctx_with(
        {"precio": "500000", "precio_letras": "SEISCIENTOS MIL QUETZALES"},
        fields=[make_field("precio", "currency"), make_field("precio_letras")],
    )
    findings = run_rules(ctx)
    rule8 = [f for f in findings if f.rule_id == "RULE-008"]
    assert len(rule8) == 1
    assert "QUINIENTOS MIL QUETZALES" in rule8[0].expected_value


# ---------------------------------------------------------------------------
# RULE-009..013 registrales y geográficas
# ---------------------------------------------------------------------------


def test_rule_009_finca_missing_for_compraventa():
    ctx = ctx_with({}, case_type="COMPRAVENTA")
    findings = run_rules(ctx)
    assert "RULE-009" in rule_ids(findings)


def test_rule_009_not_required_for_matrimonio():
    ctx = ctx_with({}, case_type="MATRIMONIO")
    findings = run_rules(ctx)
    assert "RULE-009" not in rule_ids(findings)


def test_rule_009_rejects_non_numeric_finca():
    ctx = ctx_with({"finca_registral": "ABC-123"})
    findings = run_rules(ctx)
    assert "RULE-009" in rule_ids(findings)


def test_rule_012_rejects_unknown_department():
    ctx = ctx_with({"departamento_inmueble": "NARNIA"})
    findings = run_rules(ctx)
    assert "RULE-012" in rule_ids(findings)


def test_rule_013_municipality_of_other_department_is_error():
    ctx = ctx_with(
        {"departamento_inmueble": "GUATEMALA", "municipio_inmueble": "COBAN"}
    )
    findings = run_rules(ctx)
    rule13 = [f for f in findings if f.rule_id == "RULE-013"]
    assert len(rule13) == 1
    assert rule13[0].severity == "ERROR"


def test_rule_013_unknown_municipality_is_warning():
    ctx = ctx_with({"departamento_inmueble": "GUATEMALA", "municipio_inmueble": "XUL"})
    findings = run_rules(ctx)
    rule13 = [f for f in findings if f.rule_id == "RULE-013"]
    assert len(rule13) == 1
    assert rule13[0].severity == "WARNING"


# ---------------------------------------------------------------------------
# RULE-014..018 integridad documental
# ---------------------------------------------------------------------------


def test_clauses_duplicate_and_missing_and_disorder():
    ctx = ctx_with(
        {
            "clausulas": [
                {"numero": 1, "texto": "PRIMERA"},
                {"numero": 2, "texto": "SEGUNDA"},
                {"numero": 2, "texto": "SEGUNDA BIS"},
                {"numero": 4, "texto": "CUARTA"},
            ]
        }
    )
    findings = run_rules(ctx)
    ids = rule_ids(findings)
    assert "RULE-014" in ids  # falta el inciso 3
    assert "RULE-015" in ids  # inciso 2 duplicado


def test_clauses_out_of_order_warning():
    ctx = ctx_with({"clausulas": [{"numero": 2}, {"numero": 1}]})
    findings = run_rules(ctx)
    rule16 = [f for f in findings if f.rule_id == "RULE-016"]
    assert len(rule16) == 1
    assert rule16[0].severity == "WARNING"


def test_clauses_ordinal_words_parsed():
    ctx = ctx_with(
        {
            "clausulas": [
                {"texto": "PRIMERA: comparecencia"},
                {"texto": "SEGUNDA: objeto"},
            ]
        }
    )
    findings = run_rules(ctx)
    assert "RULE-014" not in rule_ids(findings)
    assert "RULE-015" not in rule_ids(findings)


def test_rule_017_placeholder_in_value_is_critical():
    ctx = ctx_with({"observaciones": "El comprador es {{ comprador.nombre }}"})
    findings = run_rules(ctx)
    rule17 = [f for f in findings if f.rule_id == "RULE-017"]
    assert len(rule17) == 1
    assert rule17[0].severity == "CRITICAL"


def test_rule_018_socios_percentages_must_sum_100():
    ctx = ctx_with(
        {
            "socios": [
                {"socio_nombre": "A", "socio_porcentaje": "60"},
                {"socio_nombre": "B", "socio_porcentaje": "30"},
            ]
        },
        case_type="SOCIEDAD",
    )
    findings = run_rules(ctx)
    rule18 = [f for f in findings if f.rule_id == "RULE-018"]
    assert len(rule18) == 1
    assert rule18[0].current_value == "90%"


def test_rule_018_clean_when_sums_100():
    ctx = ctx_with(
        {
            "socios": [
                {"socio_nombre": "A", "socio_porcentaje": "60"},
                {"socio_nombre": "B", "socio_porcentaje": "40"},
            ]
        },
        case_type="SOCIEDAD",
    )
    findings = run_rules(ctx)
    assert "RULE-018" not in rule_ids(findings)


# ---------------------------------------------------------------------------
# RULE-020 duplicados y resumen del motor
# ---------------------------------------------------------------------------


def test_rule_020_duplicate_party_same_role():
    parties = [
        make_party("COMPRADOR", "Ana Lopez", "1234567890101"),
        make_party("COMPRADOR", "Ana Lopez", "1234567890101"),
    ]
    ctx = ctx_with({}, parties=parties)
    findings = run_rules(ctx)
    assert "RULE-020" in rule_ids(findings)


def test_summarize_limpio_when_no_findings():
    summary = summarize([])
    assert summary["status"] == "LIMPIO"
    assert summary["total"] == 0


def test_summarize_status_levels():
    party = make_party("COMPRADOR", "Ana Lopez", "1234567890101")
    ctx = ctx_with({"comprador_dpi": "1234567890102"}, parties=[party])
    findings = run_rules(ctx)
    summary = summarize(findings)
    assert summary["status"] == "CON_INCONSISTENCIAS"
    assert summary["critical"] == 1


def test_findings_sorted_by_severity():
    party = make_party("COMPRADOR", "Ana Lopez", "1234567890101")
    ctx = ctx_with(
        {
            "comprador_dpi": "1234567890102",  # RULE-004 CRITICAL
            "departamento_inmueble": "NARNIA",  # RULE-012 ERROR
            "municipio_inmueble": "XUL",  # RULE-013 WARNING
        },
        parties=[party],
    )
    findings = run_rules(ctx)
    severities = [f.severity for f in findings]
    assert severities == sorted(
        severities, key=lambda s: {"CRITICAL": 0, "ERROR": 1, "WARNING": 2}[s]
    )
