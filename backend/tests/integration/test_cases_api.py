"""Integration tests for GET/POST/PUT/DELETE /cases endpoint and parties."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_admin(db_session: Session, suffix: str) -> User:
    user = User(
        username=f"admin_{suffix}",
        email=f"admin_{suffix}@bufetenotarial.demo",
        full_name=f"Admin {suffix}",
        password_hash=get_password_hash("Admin1234!"),
        role="ADMINISTRADOR",
        status="ACTIVE",
    )
    db_session.add(user)
    db_session.commit()
    return user


def _get_token(client: TestClient, username: str) -> str:
    resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": "Admin1234!"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_client(
    client: TestClient, token: str, dpi: str, first: str = "Test"
) -> str:
    resp = client.post(
        "/api/v1/clients",
        json={"first_name": first, "last_name": "Apellido", "dpi": dpi},
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# Expedientes tests
# ---------------------------------------------------------------------------


def test_create_case_minimal(client: TestClient, db_session: Session):
    _create_admin(db_session, "case1")
    token = _get_token(client, "admin_case1")

    payload = {
        "title": "Compraventa de inmueble zona 10 Guatemala",
        "case_type": "COMPRAVENTA",
    }
    resp = client.post("/api/v1/cases", json=payload, headers=_auth(token))
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["case_number"].startswith("EXP-")
    assert data["status"] == "ABIERTO"
    assert data["case_type"] == "COMPRAVENTA"


def test_create_case_with_parties(client: TestClient, db_session: Session):
    _create_admin(db_session, "case2")
    token = _get_token(client, "admin_case2")

    client_id = _create_client(client, token, "5000000000001", "Vendedor")

    payload = {
        "title": "Donación entre vivos de vehículo automotor",
        "case_type": "DONACION",
        "parties": [
            {"client_id": client_id, "party_role": "DONANTE", "order_index": 0}
        ],
    }
    resp = client.post("/api/v1/cases", json=payload, headers=_auth(token))
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert len(data["parties"]) == 1
    assert data["parties"][0]["party_role"] == "DONANTE"
    assert data["parties"][0]["client"]["dpi"] == "5000000000001"


def test_create_case_invalid_type(client: TestClient, db_session: Session):
    _create_admin(db_session, "case3")
    token = _get_token(client, "admin_case3")

    payload = {"title": "Test expediente tipo inválido", "case_type": "TIPO_INVENTADO"}
    resp = client.post("/api/v1/cases", json=payload, headers=_auth(token))
    assert resp.status_code == 400


def test_list_cases(client: TestClient, db_session: Session):
    _create_admin(db_session, "case4")
    token = _get_token(client, "admin_case4")

    for i in range(3):
        client.post(
            "/api/v1/cases",
            json={"title": f"Expediente de prueba {i}", "case_type": "ARRENDAMIENTO"},
            headers=_auth(token),
        )

    resp = client.get("/api/v1/cases", headers=_auth(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 3


def test_get_case_by_id(client: TestClient, db_session: Session):
    _create_admin(db_session, "case5")
    token = _get_token(client, "admin_case5")

    create_resp = client.post(
        "/api/v1/cases",
        json={"title": "Constitución de Sociedad XYZ", "case_type": "SOCIEDAD"},
        headers=_auth(token),
    )
    case_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/v1/cases/{case_id}", headers=_auth(token))
    assert get_resp.status_code == 200
    assert get_resp.json()["case_type"] == "SOCIEDAD"


def test_update_case_status(client: TestClient, db_session: Session):
    _create_admin(db_session, "case6")
    token = _get_token(client, "admin_case6")

    create_resp = client.post(
        "/api/v1/cases",
        json={"title": "Matrimonio civil notarial", "case_type": "MATRIMONIO"},
        headers=_auth(token),
    )
    case_id = create_resp.json()["id"]

    upd_resp = client.put(
        f"/api/v1/cases/{case_id}",
        json={"status": "EN_REVISION", "protocol_folio": "128"},
        headers=_auth(token),
    )
    assert upd_resp.status_code == 200
    assert upd_resp.json()["status"] == "EN_REVISION"
    assert upd_resp.json()["protocol_folio"] == "128"


def test_cancel_case(client: TestClient, db_session: Session):
    _create_admin(db_session, "case7")
    token = _get_token(client, "admin_case7")

    create_resp = client.post(
        "/api/v1/cases",
        json={"title": "Expediente a cancelar", "case_type": "COMPRAVENTA"},
        headers=_auth(token),
    )
    case_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/cases/{case_id}", headers=_auth(token))
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "CANCELADO"


# ---------------------------------------------------------------------------
# Case Parties tests
# ---------------------------------------------------------------------------


def test_add_party_to_case(client: TestClient, db_session: Session):
    _create_admin(db_session, "case8")
    token = _get_token(client, "admin_case8")

    client_id = _create_client(client, token, "6000000000001", "Comprador")
    create_resp = client.post(
        "/api/v1/cases",
        json={"title": "Compraventa con partes añadidas", "case_type": "COMPRAVENTA"},
        headers=_auth(token),
    )
    case_id = create_resp.json()["id"]

    party_resp = client.post(
        f"/api/v1/cases/{case_id}/parties",
        json={"client_id": client_id, "party_role": "COMPRADOR", "order_index": 0},
        headers=_auth(token),
    )
    assert party_resp.status_code == 201
    assert party_resp.json()["party_role"] == "COMPRADOR"


def test_add_duplicate_party_rejected(client: TestClient, db_session: Session):
    _create_admin(db_session, "case9")
    token = _get_token(client, "admin_case9")

    client_id = _create_client(client, token, "7000000000001", "Vendedor")
    create_resp = client.post(
        "/api/v1/cases",
        json={"title": "Expediente duplicado partes", "case_type": "COMPRAVENTA"},
        headers=_auth(token),
    )
    case_id = create_resp.json()["id"]

    party_payload = {"client_id": client_id, "party_role": "VENDEDOR"}
    client.post(
        f"/api/v1/cases/{case_id}/parties", json=party_payload, headers=_auth(token)
    )
    dup_resp = client.post(
        f"/api/v1/cases/{case_id}/parties", json=party_payload, headers=_auth(token)
    )
    assert dup_resp.status_code == 400


def test_remove_party_from_case(client: TestClient, db_session: Session):
    _create_admin(db_session, "case10")
    token = _get_token(client, "admin_case10")

    client_id = _create_client(client, token, "8000000000001", "Testigo")
    create_resp = client.post(
        "/api/v1/cases",
        json={"title": "Expediente para remover parte", "case_type": "ARRENDAMIENTO"},
        headers=_auth(token),
    )
    case_id = create_resp.json()["id"]

    party_resp = client.post(
        f"/api/v1/cases/{case_id}/parties",
        json={"client_id": client_id, "party_role": "TESTIGO"},
        headers=_auth(token),
    )
    party_id = party_resp.json()["id"]

    del_resp = client.delete(
        f"/api/v1/cases/{case_id}/parties/{party_id}",
        headers=_auth(token),
    )
    assert del_resp.status_code == 204


def test_list_cases_unauthenticated(client: TestClient):
    resp = client.get("/api/v1/cases")
    assert resp.status_code == 401


def test_case_number_sequence(client: TestClient, db_session: Session):
    """Each created case must have a unique sequential EXP-YYYY-##### number."""
    _create_admin(db_session, "case11")
    token = _get_token(client, "admin_case11")

    r1 = client.post(
        "/api/v1/cases",
        json={"title": "Caso secuencial A", "case_type": "COMPRAVENTA"},
        headers=_auth(token),
    )
    r2 = client.post(
        "/api/v1/cases",
        json={"title": "Caso secuencial B", "case_type": "DONACION"},
        headers=_auth(token),
    )
    assert r1.json()["case_number"] != r2.json()["case_number"]
