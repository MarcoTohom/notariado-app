"""Alineación del corpus experimental con el motor de reglas.

Garantía científica del experimento: todo caso íntegro generado produce CERO
hallazgos y toda anomalía inyectada dispara EXACTAMENTE las reglas esperadas
(registradas en expected_findings del test_case).
"""

import random

import pytest

from app.models.case import Case
from app.models.dynamic_field import TemplateField
from app.rules.context import PartyInfo, ValidationContext
from app.rules.engine import run_rules
from app.utils import synthetic_data as syn


def _ctx(case_type: str, values: dict, persons: list[dict]) -> ValidationContext:
    roles = syn.PARTY_ROLES[case_type]
    parties = [
        PartyInfo(
            party_id=f"p{i}",
            role=role,
            client_id=f"c{i}",
            full_name=person["full_name"],
            dpi=person["dpi"],
            nit=person["nit"],
            tokens=[],
        )
        for i, (role, person) in enumerate(zip(roles, persons))
    ]
    fields = [
        TemplateField(
            template_version_id="v1",
            key=f["key"],
            label=f["label"],
            field_type=f["field_type"],
            required=f.get("required", False),
            options_json=f.get("options_json", {}),
            source="manual",
        )
        for f in syn.FORM_FIELDS[case_type]
    ]
    return ValidationContext(
        case=Case(case_number="EXP-2026-00001", title="t", case_type=case_type),
        parties=parties,
        fields=fields,
        values=values,
    )


def _persons(case_type: str, rng: random.Random, faker) -> list[dict]:
    return [syn.synthetic_person(faker, rng) for _ in syn.PARTY_ROLES[case_type]]


@pytest.mark.parametrize("case_type", syn.CASE_TYPES)
def test_clean_case_produces_zero_findings(case_type: str):
    faker = syn.make_faker()
    rng = random.Random(syn.CORPUS_SEED)
    persons = _persons(case_type, rng, faker)
    values = syn.build_clean_values(case_type, persons, rng)
    findings = run_rules(_ctx(case_type, values, persons))
    assert findings == [], (
        f"Caso íntegro {case_type} produjo hallazgos inesperados: "
        f"{[f.rule_id for f in findings]}"
    )


@pytest.mark.parametrize("case_type", syn.CASE_TYPES)
def test_each_anomaly_triggers_exactly_expected_rules(case_type: str):
    faker = syn.make_faker()
    for anomaly_rule in syn.ANOMALY_PLAN[case_type]:
        rng = random.Random()
        persons = _persons(case_type, rng, faker)
        clean = syn.build_clean_values(case_type, persons, rng)
        mutated, expected = syn.inject_anomaly(
            dict(clean), anomaly_rule, case_type, rng
        )

        # RULE-020 duplica el compareciente: se emula agregando el party extra.
        ctx = _ctx(case_type, mutated, persons)
        if anomaly_rule == "RULE-020":
            first = ctx.parties[0]
            ctx.parties.append(
                PartyInfo(
                    party_id="dup",
                    role=first.role,
                    client_id=first.client_id,
                    full_name=first.full_name,
                    dpi=first.dpi,
                    nit=first.nit,
                    tokens=[],
                )
            )

        actual = {f.rule_id for f in run_rules(ctx)}
        expected_set = set(expected)
        assert expected_set <= actual, (
            f"{case_type}/{anomaly_rule}: esperaba {expected_set}, "
            f"el motor detectó {actual}"
        )
        extra = actual - expected_set
        assert not extra, (
            f"{case_type}/{anomaly_rule}: el motor detectó reglas NO esperadas {extra} "
            f"(esperaba solo {expected_set})"
        )


def test_corpus_distribution_is_20_per_type_50_percent_anomalous():
    for case_type in syn.CASE_TYPES:
        assert len(syn.ANOMALY_PLAN[case_type]) == syn.ANOMALOUS_PER_TYPE == 10
    assert syn.CASES_PER_TYPE == 20


def test_synthetic_dpi_format_and_uniqueness():
    rng = random.Random(1)
    dpis = {syn.synthetic_dpi(rng) for _ in range(500)}
    assert all(len(d) == 13 and d.isdigit() for d in dpis)
    assert len(dpis) > 490  # prácticamente sin colisiones


def test_expected_findings_of_rule_014_include_duplicate_and_missing():
    faker = syn.make_faker()
    rng = random.Random()
    persons = _persons("COMPRAVENTA", rng, faker)
    clean = syn.build_clean_values("COMPRAVENTA", persons, rng)
    _, expected = syn.inject_anomaly(dict(clean), "RULE-014", "COMPRAVENTA", rng)
    assert expected == ["RULE-014", "RULE-015"]
