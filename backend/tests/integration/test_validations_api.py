"""Integration tests for the notarial rule engine API (Fase 6).

Flujo: cliente -> expediente con compareciente -> versión de formulario ->
valores -> POST /validations/run -> hallazgos persistidos con trazabilidad.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.support.auth import auth_headers as _auth
from tests.support.auth import create_user as _create_user
from tests.support.auth import login_token as _token
from tests.support.records import create_case_with_party as _setup_case_with_party

BASE = "/api/v1"


def _create_version(client: TestClient, token: str) -> str:
    resp = client.post(
        f"{BASE}/fields/definitions",
        json={
            "name": "Formulario Motor Reglas",
            "case_type": "COMPRAVENTA",
            "fields": [
                {
                    "key": "comprador_dpi",
                    "label": "DPI Comprador",
                    "field_type": "dpi",
                    "required": True,
                },
                {
                    "key": "comprador_nombre",
                    "label": "Nombre Comprador",
                    "field_type": "name",
                    "required": True,
                },
                {"key": "precio_inmueble", "label": "Precio", "field_type": "currency"},
                {
                    "key": "precio_letras",
                    "label": "Precio en letras",
                    "field_type": "text",
                },
                {"key": "finca_registral", "label": "Finca", "field_type": "text"},
                {"key": "folio_registral", "label": "Folio", "field_type": "text"},
                {"key": "libro_registral", "label": "Libro", "field_type": "text"},
                {
                    "key": "departamento_inmueble",
                    "label": "Departamento",
                    "field_type": "text",
                },
            ],
        },
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _run(
    client: TestClient, token: str, case_id: str, version_id: str, values=None
) -> dict:
    payload = {"case_id": case_id, "template_version_id": version_id}
    if values is not None:
        payload["values"] = values
    resp = client.post(f"{BASE}/validations/run", json=payload, headers=_auth(token))
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Flujo limpio e inconsistente
# ---------------------------------------------------------------------------


def test_clean_case_returns_limpio_and_persists(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "val1", "ADMINISTRADOR")
    token = _token(client, "user_val1")
    case_id, _ = _setup_case_with_party(client, token)
    version_id = _create_version(client, token)

    result = _run(
        client,
        token,
        case_id,
        version_id,
        values={
            "comprador_dpi": "1234567890101",
            "comprador_nombre": "Carlos Mendez Ruiz",
            "precio_inmueble": "500000",
            "precio_letras": "QUINIENTOS MIL QUETZALES",
            "finca_registral": "12345",
            "folio_registral": "678",
            "libro_registral": "12",
            "departamento_inmueble": "GUATEMALA",
        },
    )
    assert result["status"] == "LIMPIO"
    assert result["total_findings"] == 0
    assert result["findings"] == []

    # Persistencia: la corrida queda como última del expediente.
    resp = client.get(
        f"{BASE}/validations/cases/{case_id}/latest", headers=_auth(token)
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == result["id"]
    assert resp.json()["status"] == "LIMPIO"


def test_inconsistent_case_detects_expected_rules(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "val2", "ADMINISTRADOR")
    token = _token(client, "user_val2")
    case_id, _ = _setup_case_with_party(client, token)
    version_id = _create_version(client, token)

    result = _run(
        client,
        token,
        case_id,
        version_id,
        values={
            "comprador_dpi": "1234567890102",  # RULE-004 (formato válido, distinto al del cliente)
            "comprador_nombre": "Nombre Equivocado",  # RULE-006
            "precio_inmueble": "500000",
            "precio_letras": "SEISCIENTOS MIL QUETZALES",  # RULE-008
            "finca_registral": "ABC",  # RULE-009
            "departamento_inmueble": "NARNIA",  # RULE-012
        },
    )
    rule_ids = {f["rule_id"] for f in result["findings"]}
    assert {"RULE-004", "RULE-006", "RULE-008", "RULE-009", "RULE-012"} <= rule_ids
    assert result["status"] == "CON_INCONSISTENCIAS"
    assert result["critical_count"] >= 2  # RULE-004 y RULE-006

    rule4 = next(f for f in result["findings"] if f["rule_id"] == "RULE-004")
    assert rule4["severity"] == "CRITICAL"
    assert rule4["current_value"] == "1234567890102"
    assert rule4["expected_value"] == "1234567890101"
    assert "Comparecencia" in rule4["location"]

    # Historial del expediente
    resp = client.get(f"{BASE}/validations/cases/{case_id}", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_required_fields_reported_when_empty(client: TestClient, db_session: Session):
    _create_user(db_session, "val3", "ADMINISTRADOR")
    token = _token(client, "user_val3")
    case_id, _ = _setup_case_with_party(client, token)
    version_id = _create_version(client, token)

    result = _run(client, token, case_id, version_id, values={})
    rule_ids = {f["rule_id"] for f in result["findings"]}
    assert "RULE-001" in rule_ids
    # Los datos registrales también se exigen en compraventa.
    assert "RULE-009" in rule_ids


def test_stored_values_are_used_when_no_override(
    client: TestClient, db_session: Session
):
    _create_user(db_session, "val4", "ADMINISTRADOR")
    token = _token(client, "user_val4")
    case_id, _ = _setup_case_with_party(client, token)
    version_id = _create_version(client, token)

    # Guardar valores consistentes mediante el motor de formularios (Fase 4).
    resp = client.put(
        f"{BASE}/fields/cases/{case_id}/versions/{version_id}",
        json={
            "revision": 0,
            "values": {
                "comprador_dpi": "1234567890101",
                "comprador_nombre": "Carlos Mendez Ruiz",
                "precio_inmueble": "500000",
                "precio_letras": "QUINIENTOS MIL QUETZALES",
                "finca_registral": "12345",
                "folio_registral": "678",
                "libro_registral": "12",
                "departamento_inmueble": "GUATEMALA",
            },
        },
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text

    result = _run(client, token, case_id, version_id)
    assert result["status"] == "LIMPIO"


# ---------------------------------------------------------------------------
# Seguridad y catálogo
# ---------------------------------------------------------------------------


def test_run_forbidden_for_administracion(client: TestClient, db_session: Session):
    """ADMINISTRACION no tiene validations:execute."""
    _create_user(db_session, "val5", "ADMINISTRACION")
    token = _token(client, "user_val5")
    resp = client.post(
        f"{BASE}/validations/run",
        json={"case_id": "x", "template_version_id": "y"},
        headers=_auth(token),
    )
    assert resp.status_code == 403


def test_run_requires_auth(client: TestClient):
    resp = client.post(
        f"{BASE}/validations/run", json={"case_id": "x", "template_version_id": "y"}
    )
    assert resp.status_code == 401


def test_catalog_exposes_20_rules(client: TestClient, db_session: Session):
    _create_user(db_session, "val6", "AUXILIAR")
    token = _token(client, "user_val6")
    resp = client.get(f"{BASE}/validations/catalog", headers=_auth(token))
    assert resp.status_code == 200
    catalog = resp.json()
    assert len(catalog) == 20
    ids = {item["rule_id"] for item in catalog}
    assert ids == {f"RULE-{n:03d}" for n in range(1, 21)}


def test_run_case_not_found(client: TestClient, db_session: Session):
    _create_user(db_session, "val7", "ADMINISTRADOR")
    token = _token(client, "user_val7")
    resp = client.post(
        f"{BASE}/validations/run",
        json={
            "case_id": "00000000-0000-0000-0000-000000000000",
            "template_version_id": "00000000-0000-0000-0000-000000000000",
        },
        headers=_auth(token),
    )
    assert resp.status_code == 404
