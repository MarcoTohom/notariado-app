"""Módulo de medición científica de tesis (Fase 11).

Genera el corpus de 100 casos sintéticos, gestiona las corridas de medición
(TRADITIONAL vs SYSTEM) con cronómetro por etapas, computa errores
detectados/omitidos contra los hallazgos esperados y calcula la estadística
inferencial real (Shapiro-Wilk + t de Student pareada o Wilcoxon) con scipy.
Jamás se insertan tiempos ficticios: toda métrica deriva de corridas reales.
"""

import math
from datetime import datetime, timezone
from decimal import Decimal

import pandas as pd
from fastapi import HTTPException
from scipy import stats as scipy_stats
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.operations import flush
from app.models.audit import AuditLog
from app.models.case import Case
from app.models.case_field_values import CaseFieldValues
from app.models.case_party import CaseParty
from app.models.client import Client
from app.models.dynamic_field import TemplateField
from app.models.experiment import TestCase, TestExecution, TimeMeasurement
from app.models.template import Template, TemplateVersion
from app.models.user import User
from app.rules.engine import run_rules
from app.services.validation_context import build_validation_context
from app.utils import synthetic_data as syn

UTC = timezone.utc
SYNTHETIC_MARK = "SYNTHETIC-CORPUS"


def _now() -> datetime:
    return datetime.now(UTC)


def _iso(value: datetime) -> str:
    return value.isoformat()


def _parse(value: str) -> datetime:
    return datetime.fromisoformat(value)


# ---------------------------------------------------------------------------
# Generación del corpus (100 casos sintéticos)
# ---------------------------------------------------------------------------


def _next_case_number(db: Session, sequence: int) -> str:
    year = _now().year
    return f"EXP-{year}-{sequence:05d}"


def _max_case_sequence(db: Session) -> int:
    from sqlalchemy import func

    year = _now().year
    prefix = f"EXP-{year}-"
    max_number: str | None = (
        db.query(func.max(Case.case_number))
        .filter(Case.case_number.like(f"{prefix}%"))
        .scalar()
    )
    if max_number:
        try:
            return int(max_number.split("-")[-1])
        except (ValueError, IndexError):
            return 0
    return 0


def _ensure_form_version(db: Session, case_type: str) -> TemplateVersion:
    """Versión FIELD_DEFINITION del formulario estándar del tipo de escritura."""
    name = f"Formulario Estándar {case_type.title()} (Experimento)"
    template = db.query(Template).filter_by(name=name).first()
    if template:
        version = (
            db.query(TemplateVersion)
            .filter_by(template_id=template.id)
            .order_by(TemplateVersion.version_number.desc())
            .first()
        )
        if version:
            return version
    template = Template(name=name, case_type=case_type, status="ACTIVE")
    db.add(template)
    flush(db)
    version = TemplateVersion(
        template_id=template.id, version_number=1, status="FIELD_DEFINITION"
    )
    db.add(version)
    flush(db)
    for order, field_def in enumerate(syn.FORM_FIELDS[case_type]):
        db.add(
            TemplateField(
                template_version_id=version.id,
                key=field_def["key"],
                label=field_def["label"],
                field_type=field_def["field_type"],
                required=field_def.get("required", False),
                nullable=True,
                options_json=field_def.get("options_json", {}),
                source="manual",
                display_order=order,
            )
        )
    flush(db)
    return version


def _delete_previous_corpus(db: Session) -> None:
    previous_cases = db.query(Case).filter(Case.internal_notes == SYNTHETIC_MARK).all()
    case_ids = [c.id for c in previous_cases]
    if not case_ids:
        return
    test_cases = db.query(TestCase).filter(TestCase.case_id.in_(case_ids)).all()
    test_case_ids = [t.id for t in test_cases]
    if test_case_ids:
        executions = (
            db.query(TestExecution)
            .filter(TestExecution.test_case_id.in_(test_case_ids))
            .all()
        )
        execution_ids = [e.id for e in executions]
        if execution_ids:
            db.query(TimeMeasurement).filter(
                TimeMeasurement.execution_id.in_(execution_ids)
            ).delete(synchronize_session=False)
        db.query(TestExecution).filter(
            TestExecution.test_case_id.in_(test_case_ids)
        ).delete(synchronize_session=False)
    db.query(TestCase).filter(TestCase.case_id.in_(case_ids)).delete(
        synchronize_session=False
    )
    db.query(CaseFieldValues).filter(CaseFieldValues.case_id.in_(case_ids)).delete(
        synchronize_session=False
    )
    parties = db.query(CaseParty).filter(CaseParty.case_id.in_(case_ids)).all()
    client_ids = {p.client_id for p in parties}
    db.query(CaseParty).filter(CaseParty.case_id.in_(case_ids)).delete(
        synchronize_session=False
    )
    db.query(Case).filter(Case.id.in_(case_ids)).delete(synchronize_session=False)
    for client_id in client_ids:
        client = db.get(Client, client_id)
        if client is not None:
            db.delete(client)
    flush(db)


def generate_corpus(db: Session, user: User) -> dict:
    """Genera (o regenera) el corpus completo: 100 casos, 20 por tipo."""
    faker = syn.make_faker()
    import random

    rng = random.Random(syn.CORPUS_SEED)
    _delete_previous_corpus(db)

    sequence = _max_case_sequence(db)
    created: dict[str, dict[str, int]] = {}

    for case_type in syn.CASE_TYPES:
        version = _ensure_form_version(db, case_type)
        created[case_type] = {"total": 0, "clean": 0, "anomalous": 0}
        anomalies = syn.ANOMALY_PLAN[case_type]
        roles = syn.PARTY_ROLES[case_type]

        for index in range(syn.CASES_PER_TYPE):
            is_anomalous = index >= syn.CASES_PER_TYPE - syn.ANOMALOUS_PER_TYPE
            anomaly_rule = (
                anomalies[index - syn.ANOMALOUS_PER_TYPE] if is_anomalous else None
            )

            # 1) Personas sintéticas y clientes.
            persons = [syn.synthetic_person(faker, rng) for _ in roles]
            clients = []
            for person in persons:
                client = Client(
                    first_name=person["first_name"],
                    last_name=person["last_name"],
                    dpi=person["dpi"],
                    nit=person["nit"],
                    nationality="GUATEMALTECA",
                    status="ACTIVE",
                )
                db.add(client)
                flush(db)
                clients.append(client)

            # 2) Expediente con comparecientes.
            sequence += 1
            case = Case(
                case_number=_next_case_number(db, sequence),
                case_type=case_type,
                title=(
                    f"Caso sintético {case_type.lower()} "
                    f"{'anómalo' if is_anomalous else 'íntegro'} #{index + 1:02d}"
                ),
                internal_notes=SYNTHETIC_MARK,
                status="ABIERTO",
            )
            db.add(case)
            flush(db)
            for order, (role, client) in enumerate(zip(roles, clients)):
                db.add(
                    CaseParty(
                        case_id=case.id,
                        client_id=client.id,
                        party_role=role,
                        order_index=order,
                    )
                )
            # RULE-020: compareciente duplicado deliberado.
            if anomaly_rule == "RULE-020":
                db.add(
                    CaseParty(
                        case_id=case.id,
                        client_id=clients[0].id,
                        party_role=roles[0],
                        order_index=len(roles),
                    )
                )
            flush(db)

            # 3) Valores íntegros + inyección de anomalía.
            values = syn.build_clean_values(case_type, persons, rng)
            expected: list[str] = []
            anomaly_types: list[str] = []
            if anomaly_rule:
                values, expected = syn.inject_anomaly(
                    values, anomaly_rule, case_type, rng
                )
                anomaly_types = [anomaly_rule]

            db.add(
                CaseFieldValues(
                    case_id=case.id,
                    template_version_id=version.id,
                    values=values,
                    revision=1,
                )
            )
            db.add(
                TestCase(
                    case_id=case.id,
                    template_version_id=version.id,
                    case_type=case_type,
                    title=case.title,
                    has_anomalies=is_anomalous,
                    anomaly_types=anomaly_types,
                    expected_findings=expected,
                )
            )
            flush(db)
            created[case_type]["total"] += 1
            created[case_type]["anomalous" if is_anomalous else "clean"] += 1

    db.add(
        AuditLog(
            user_id=user.id,
            user_email=user.email,
            action="GENERATE_CORPUS",
            module="EXPERIMENTO",
            record_id=None,
            status="SUCCESS",
            details="Corpus experimental regenerado: 100 casos sintéticos (50 íntegros, 50 con anomalías).",
        )
    )
    db.commit()
    return created


# ---------------------------------------------------------------------------
# Corridas de medición (cronómetro y errores)
# ---------------------------------------------------------------------------


def start_execution(
    db: Session, test_case_id: str, method: str, user: User
) -> TestExecution:
    test_case = db.get(TestCase, test_case_id)
    if test_case is None:
        raise HTTPException(404, "Caso de prueba no encontrado.")
    if method not in {"TRADITIONAL", "SYSTEM"}:
        raise HTTPException(422, "Método inválido: use TRADITIONAL o SYSTEM.")
    open_execution = (
        db.query(TestExecution)
        .filter_by(executed_by_id=user.id, finished_at=None)
        .first()
    )
    if open_execution:
        raise HTTPException(
            409, "Ya tiene una corrida en curso; finalícela antes de iniciar otra."
        )
    execution = TestExecution(
        test_case_id=test_case_id,
        method=method,
        started_at=_iso(_now()),
        executed_by_id=user.id,
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    return execution


def _compute_system_errors(db: Session, test_case: TestCase) -> tuple[int, int]:
    """Errores detectados/omitidos por el sistema vs. hallazgos esperados."""
    ctx = build_validation_context(
        db, test_case.case_id, test_case.template_version_id, None
    )
    actual = {finding.rule_id for finding in run_rules(ctx)}
    expected = set(test_case.expected_findings or [])
    found = len(expected & actual)
    missed = len(expected - actual)
    return found, missed


def finish_execution(
    db: Session,
    execution_id: str,
    user: User,
    errors_found: int | None,
    errors_missed: int | None,
    corrections: int,
    notes: str | None,
) -> TestExecution:
    execution = db.get(TestExecution, execution_id)
    if execution is None or execution.executed_by_id != user.id:
        raise HTTPException(404, "Corrida no encontrada.")
    if execution.finished_at:
        raise HTTPException(409, "La corrida ya fue finalizada.")

    finished = _now()
    started = _parse(execution.started_at)
    duration = max(0, int((finished - started).total_seconds()))
    execution.finished_at = _iso(finished)
    execution.duration_seconds = duration
    execution.duration_minutes = str(Decimal(duration) / Decimal(60))
    execution.corrections = corrections
    execution.notes = notes

    if execution.method == "SYSTEM":
        test_case = db.get(TestCase, execution.test_case_id)
        found, missed = _compute_system_errors(db, test_case)
        execution.errors_found = found
        execution.errors_missed = missed
    else:
        execution.errors_found = errors_found or 0
        execution.errors_missed = errors_missed or 0

    db.add(
        AuditLog(
            user_id=user.id,
            user_email=user.email,
            action="MEASURE_EXECUTION",
            module="EXPERIMENTO",
            record_id=execution.id,
            status="SUCCESS",
            details=(
                f"Corrida {execution.method}: {duration}s, "
                f"{execution.errors_found} detectados, {execution.errors_missed} omitidos."
            ),
        )
    )
    db.commit()
    db.refresh(execution)
    return execution


def start_stage(
    db: Session, execution_id: str, stage: str, user: User
) -> TimeMeasurement:
    execution = db.get(TestExecution, execution_id)
    if execution is None or execution.executed_by_id != user.id:
        raise HTTPException(404, "Corrida no encontrada.")
    if stage not in {"DETECCION", "CORRECCION", "GENERACION"}:
        raise HTTPException(422, "Etapa inválida.")
    measurement = TimeMeasurement(
        execution_id=execution_id, stage=stage, started_at=_iso(_now())
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


def finish_stage(db: Session, measurement_id: str, user: User) -> TimeMeasurement:
    measurement = db.get(TimeMeasurement, measurement_id)
    if measurement is None:
        raise HTTPException(404, "Medición no encontrada.")
    execution = db.get(TestExecution, measurement.execution_id)
    if execution is None or execution.executed_by_id != user.id:
        raise HTTPException(404, "Medición no encontrada.")
    if measurement.finished_at:
        raise HTTPException(409, "La etapa ya fue finalizada.")
    finished = _now()
    measurement.finished_at = _iso(finished)
    measurement.duration_seconds = max(
        0, int((finished - _parse(measurement.started_at)).total_seconds())
    )
    db.commit()
    db.refresh(measurement)
    return measurement


# ---------------------------------------------------------------------------
# Estadística descriptiva e inferencial (datos reales únicamente)
# ---------------------------------------------------------------------------


def _series(durations: list[int]) -> dict:
    n = len(durations)
    if n == 0:
        return {
            "n": 0,
            "mean_seconds": None,
            "std_seconds": None,
            "ci95_seconds": None,
            "mean_minutes": None,
        }
    mean = sum(durations) / n
    std = math.sqrt(sum((d - mean) ** 2 for d in durations) / (n - 1)) if n > 1 else 0.0
    ci95 = 1.96 * std / math.sqrt(n) if n > 1 else 0.0
    return {
        "n": n,
        "mean_seconds": round(mean, 2),
        "std_seconds": round(std, 2),
        "ci95_seconds": round(ci95, 2),
        "mean_minutes": round(mean / 60, 2),
    }


def _normality(durations: list[int]) -> dict | None:
    if len(durations) < 3:
        return None
    stat, p_value = scipy_stats.shapiro(durations)
    return {
        "W": round(float(stat), 4),
        "p_value": round(float(p_value), 6),
        "normal": bool(p_value >= 0.05),
    }


def compute_stats(db: Session) -> dict:
    finished = (
        db.query(TestExecution).filter(TestExecution.finished_at.isnot(None)).all()
    )
    traditional = [e.duration_seconds for e in finished if e.method == "TRADITIONAL"]
    system = [e.duration_seconds for e in finished if e.method == "SYSTEM"]

    baseline = settings.DEFAULT_BASELINE_MINUTES
    trad_minutes = (
        (sum(traditional) / len(traditional) / 60) if traditional else float(baseline)
    )
    system_minutes = (sum(system) / len(system) / 60) if system else None
    reduction = (
        round(((trad_minutes - system_minutes) / trad_minutes) * 100, 2)
        if system_minutes is not None and trad_minutes > 0
        else None
    )

    # Parejas: casos ejecutados con AMBOS métodos (mismo usuario opcional).
    pairs: list[tuple[int, int]] = []
    by_case: dict[str, dict[str, int]] = {}
    for e in finished:
        by_case.setdefault(e.test_case_id, {})[e.method] = e.duration_seconds
    for methods in by_case.values():
        if "TRADITIONAL" in methods and "SYSTEM" in methods:
            pairs.append((methods["TRADITIONAL"], methods["SYSTEM"]))
    paired_test = None
    if len(pairs) >= 3:
        trad_series = [p[0] for p in pairs]
        syst_series = [p[1] for p in pairs]
        normal_trad = scipy_stats.shapiro(trad_series).pvalue >= 0.05
        normal_syst = scipy_stats.shapiro(syst_series).pvalue >= 0.05
        if normal_trad and normal_syst:
            result = scipy_stats.ttest_rel(trad_series, syst_series)
            test_name = "t_student_pareada"
        else:
            result = scipy_stats.wilcoxon(trad_series, syst_series)
            test_name = "wilcoxon"
        paired_test = {
            "test": test_name,
            "pairs": len(pairs),
            "statistic": round(float(result.statistic), 4),
            "p_value": round(float(result.pvalue), 6),
            "alpha": 0.05,
            "significant": bool(result.pvalue < 0.05),
        }

    return {
        "baseline_minutes": baseline,
        "baseline_source": "MEDICIONES" if traditional else "HISTORICA",
        "traditional": {
            **_series(traditional),
            "errors_found": sum(
                e.errors_found for e in finished if e.method == "TRADITIONAL"
            ),
            "errors_missed": sum(
                e.errors_missed for e in finished if e.method == "TRADITIONAL"
            ),
            "normality": _normality(traditional),
        },
        "system": {
            **_series(system),
            "errors_found": sum(
                e.errors_found for e in finished if e.method == "SYSTEM"
            ),
            "errors_missed": sum(
                e.errors_missed for e in finished if e.method == "SYSTEM"
            ),
            "normality": _normality(system),
        },
        "traditional_mean_minutes_used": round(trad_minutes, 2),
        "reduction_percentage": reduction,
        "paired_test": paired_test,
        "cases_total": db.query(TestCase).count(),
        "cases_with_anomalies": db.query(TestCase)
        .filter_by(has_anomalies=True)
        .count(),
        "executions_total": len(finished),
    }


# ---------------------------------------------------------------------------
# Exportación para el Capítulo IV (XLSX / CSV)
# ---------------------------------------------------------------------------


def _executions_dataframe(db: Session) -> pd.DataFrame:
    rows = (
        db.query(TestExecution, TestCase)
        .join(TestCase, TestExecution.test_case_id == TestCase.id)
        .order_by(TestExecution.created_at)
        .all()
    )
    records = []
    for execution, test_case in rows:
        records.append(
            {
                "execution_id": execution.id,
                "case_type": test_case.case_type,
                "case_title": test_case.title,
                "has_anomalies": test_case.has_anomalies,
                "expected_findings": ",".join(test_case.expected_findings or []),
                "method": execution.method,
                "started_at": execution.started_at,
                "finished_at": execution.finished_at or "",
                "duration_seconds": execution.duration_seconds,
                "duration_minutes": execution.duration_minutes,
                "errors_found": execution.errors_found,
                "errors_missed": execution.errors_missed,
                "corrections": execution.corrections,
            }
        )
    return pd.DataFrame.from_records(records)


def export_xlsx(db: Session) -> bytes:
    import io

    executions_df = _executions_dataframe(db)
    stats_data = compute_stats(db)
    summary_df = pd.DataFrame(
        [
            {"metric": "baseline_minutes", "value": stats_data["baseline_minutes"]},
            {"metric": "baseline_source", "value": stats_data["baseline_source"]},
            {
                "metric": "traditional_mean_minutes",
                "value": stats_data["traditional"]["mean_minutes"],
            },
            {
                "metric": "system_mean_minutes",
                "value": stats_data["system"]["mean_minutes"],
            },
            {
                "metric": "reduction_percentage",
                "value": stats_data["reduction_percentage"],
            },
            {"metric": "executions_total", "value": stats_data["executions_total"]},
            {"metric": "cases_total", "value": stats_data["cases_total"]},
        ]
    )
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        executions_df.to_excel(writer, sheet_name="Ejecuciones", index=False)
        summary_df.to_excel(writer, sheet_name="Resumen", index=False)
    return buffer.getvalue()


def export_csv(db: Session) -> str:
    return _executions_dataframe(db).to_csv(index=False)
