"""Integration tests for the thesis experiment module (Fase 11).

Ciclo completo: generación del corpus de 100 casos -> corrida cronometrada
SYSTEM con cómputo automático de errores -> corrida TRADITIONAL manual ->
estadística real -> exportación XLSX/CSV -> RBAC.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User

BASE = "/api/v1"


def _create_user(db_session: Session, suffix: str, role: str) -> User:
    user = User(
        username=f"user_{suffix}",
        email=f"user_{suffix}@bufetenotarial.demo",
        full_name=f"Usuario {suffix}",
        password_hash=get_password_hash("Admin1234!"),
        role=role,
        status="ACTIVE",
    )
    db_session.add(user)
    db_session.commit()
    return user


def _token(client: TestClient, username: str) -> str:
    resp = client.post(
        f"{BASE}/auth/login",
        json={"username_or_email": username, "password": "Admin1234!"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _generate_corpus(client: TestClient, token: str) -> dict:
    resp = client.post(f"{BASE}/experiment/cases/generate", headers=_auth(token))
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Generación del corpus
# ---------------------------------------------------------------------------


def test_generate_corpus_100_cases_stratified(client: TestClient, db_session: Session):
    _create_user(db_session, "exp1", "ADMINISTRADOR")
    token = _token(client, "user_exp1")

    result = _generate_corpus(client, token)
    assert result["total"] == 100
    assert result["anomalous"] == 50
    for case_type in [
        "COMPRAVENTA",
        "DONACION",
        "ARRENDAMIENTO",
        "MATRIMONIO",
        "SOCIEDAD",
    ]:
        assert result["distribution"][case_type] == {
            "total": 20,
            "clean": 10,
            "anomalous": 10,
        }

    # Idempotente: regenerar no duplica el corpus.
    result = _generate_corpus(client, token)
    assert result["total"] == 100

    resp = client.get(f"{BASE}/experiment/cases?limit=200", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["total"] == 100

    # Filtro por anomalías y tipo.
    resp = client.get(
        f"{BASE}/experiment/cases?case_type=SOCIEDAD&has_anomalies=true",
        headers=_auth(token),
    )
    assert resp.json()["total"] == 10
    assert all(item["expected_findings"] for item in resp.json()["items"])


def test_corpus_generation_forbidden_for_auxiliar(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "exp2", "AUXILIAR")
    token = _token(client, "user_exp2")
    resp = client.post(f"{BASE}/experiment/cases/generate", headers=_auth(token))
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Ciclo de medición cronometrada
# ---------------------------------------------------------------------------


def test_system_execution_computes_errors_automatically(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "exp3", "ADMINISTRADOR")
    token = _token(client, "user_exp3")
    _generate_corpus(client, token)

    # Elegir un caso anómalo: el sistema debe computar errores vs. esperados.
    resp = client.get(
        f"{BASE}/experiment/cases?has_anomalies=true&limit=1", headers=_auth(token)
    )
    test_case = resp.json()["items"][0]
    expected = set(test_case["expected_findings"])

    resp = client.post(
        f"{BASE}/experiment/executions/start",
        json={"test_case_id": test_case["id"], "method": "SYSTEM"},
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    execution = resp.json()
    assert execution["method"] == "SYSTEM"
    assert execution["finished_at"] is None

    # Cronómetro por etapa.
    resp = client.post(
        f"{BASE}/experiment/executions/{execution['id']}/stages/start",
        json={"stage": "DETECCION"},
        headers=_auth(token),
    )
    assert resp.status_code == 201
    stage_id = resp.json()["id"]
    resp = client.post(
        f"{BASE}/experiment/stages/{stage_id}/finish", headers=_auth(token)
    )
    assert resp.status_code == 200
    assert resp.json()["duration_seconds"] >= 0

    resp = client.post(
        f"{BASE}/experiment/executions/{execution['id']}/finish",
        json={"corrections": 1, "notes": "Revisión con el sistema."},
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text
    finished = resp.json()
    assert finished["duration_seconds"] >= 0
    assert finished["duration_minutes"] is not None
    # El sistema detecta exactamente los hallazgos esperados del caso anómalo.
    assert finished["errors_found"] == len(expected)
    assert finished["errors_missed"] == 0

    # No se puede finalizar dos veces.
    resp = client.post(
        f"{BASE}/experiment/executions/{execution['id']}/finish",
        json={},
        headers=_auth(token),
    )
    assert resp.status_code == 409


def test_traditional_execution_records_manual_counts(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "exp4", "ADMINISTRADOR")
    token = _token(client, "user_exp4")
    _generate_corpus(client, token)

    resp = client.get(f"{BASE}/experiment/cases?limit=1", headers=_auth(token))
    test_case = resp.json()["items"][0]

    resp = client.post(
        f"{BASE}/experiment/executions/start",
        json={"test_case_id": test_case["id"], "method": "TRADITIONAL"},
        headers=_auth(token),
    )
    execution = resp.json()

    resp = client.post(
        f"{BASE}/experiment/executions/{execution['id']}/finish",
        json={"errors_found": 1, "errors_missed": 2, "corrections": 1},
        headers=_auth(token),
    )
    assert resp.status_code == 200
    finished = resp.json()
    assert finished["errors_found"] == 1
    assert finished["errors_missed"] == 2
    assert finished["corrections"] == 1


def test_only_one_open_execution_per_user(client: TestClient, db_session: Session):
    _create_user(db_session, "exp5", "ADMINISTRADOR")
    token = _token(client, "user_exp5")
    _generate_corpus(client, token)

    resp = client.get(f"{BASE}/experiment/cases?limit=2", headers=_auth(token))
    cases = resp.json()["items"]

    resp = client.post(
        f"{BASE}/experiment/executions/start",
        json={"test_case_id": cases[0]["id"], "method": "SYSTEM"},
        headers=_auth(token),
    )
    assert resp.status_code == 201
    resp = client.post(
        f"{BASE}/experiment/executions/start",
        json={"test_case_id": cases[1]["id"], "method": "SYSTEM"},
        headers=_auth(token),
    )
    assert resp.status_code == 409


# ---------------------------------------------------------------------------
# Estadística y exportación
# ---------------------------------------------------------------------------


def test_stats_computed_from_real_executions(client: TestClient, db_session: Session):
    _create_user(db_session, "exp6", "ADMINISTRADOR")
    token = _token(client, "user_exp6")

    resp = client.get(f"{BASE}/experiment/stats", headers=_auth(token))
    assert resp.status_code == 200
    stats = resp.json()
    # Sin corridas: la reducción no se computa (jamás valores ficticios).
    assert stats["system"]["n"] == 0
    assert stats["reduction_percentage"] is None
    assert stats["baseline_source"] == "HISTORICA"
    assert stats["baseline_minutes"] == 240


def test_export_xlsx_and_csv(client: TestClient, db_session: Session):
    _create_user(db_session, "exp7", "ADMINISTRADOR")
    token = _token(client, "user_exp7")
    _generate_corpus(client, token)

    resp = client.get(f"{BASE}/experiment/cases?limit=1", headers=_auth(token))
    test_case = resp.json()["items"][0]
    resp = client.post(
        f"{BASE}/experiment/executions/start",
        json={"test_case_id": test_case["id"], "method": "SYSTEM"},
        headers=_auth(token),
    )
    execution = resp.json()
    client.post(
        f"{BASE}/experiment/executions/{execution['id']}/finish",
        json={"corrections": 0},
        headers=_auth(token),
    )

    resp = client.get(f"{BASE}/experiment/export.xlsx", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.content[:2] == b"PK"  # zip OpenXML

    resp = client.get(f"{BASE}/experiment/export.csv", headers=_auth(token))
    assert resp.status_code == 200
    text = resp.content.decode("utf-8")
    assert "duration_seconds" in text
    assert "SYSTEM" in text


def test_stats_after_executions_show_reduction(client: TestClient, db_session: Session):
    """Con corridas de ambos métodos, la reducción se computa de datos reales."""
    _create_user(db_session, "exp8", "ADMINISTRADOR")
    token = _token(client, "user_exp8")
    _generate_corpus(client, token)

    resp = client.get(f"{BASE}/experiment/cases?limit=1", headers=_auth(token))
    test_case = resp.json()["items"][0]

    # Duraciones simuladas ajustando el inicio: TRADITIONAL 200 min, SYSTEM 50 min.
    from datetime import datetime, timedelta, timezone

    from app.models.experiment import TestExecution

    for method, seconds in (("TRADITIONAL", 12000), ("SYSTEM", 3000)):
        resp = client.post(
            f"{BASE}/experiment/executions/start",
            json={"test_case_id": test_case["id"], "method": method},
            headers=_auth(token),
        )
        execution = resp.json()
        record = db_session.get(TestExecution, execution["id"])
        record.started_at = (
            datetime.now(timezone.utc) - timedelta(seconds=seconds)
        ).isoformat()
        db_session.commit()
        client.post(
            f"{BASE}/experiment/executions/{execution['id']}/finish",
            json={"errors_found": 1} if method == "TRADITIONAL" else {},
            headers=_auth(token),
        )

    resp = client.get(f"{BASE}/experiment/stats", headers=_auth(token))
    stats = resp.json()
    assert stats["baseline_source"] == "MEDICIONES"
    assert stats["traditional"]["n"] == 1
    assert stats["system"]["n"] == 1
    assert stats["traditional"]["mean_minutes"] == 200.0
    assert stats["system"]["mean_minutes"] == 50.0
    assert stats["reduction_percentage"] == 75.0
