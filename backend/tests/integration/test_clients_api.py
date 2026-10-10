"""Integration tests for GET/POST/PUT/DELETE /clients endpoint."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from tests.support.auth import auth_headers as _auth_headers
from tests.support.auth import create_account
from tests.support.auth import login_token as _get_token

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_admin(db_session: Session, suffix: str = "cli") -> User:
    return create_account(
        db_session, f"admin_{suffix}", f"Administrador {suffix}", "ADMINISTRADOR"
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_create_client_success(client: TestClient, db_session: Session):
    _create_admin(db_session, "c1")
    token = _get_token(client, "admin_c1")

    payload = {
        "first_name": "Juan",
        "last_name": "Pérez López",
        "dpi": "1234567890123",
        "nit": "1234567-8",
        "marital_status": "SOLTERO",
        "profession": "Comerciante",
        "nationality": "GUATEMALTECA",
        "birth_date": "1985-06-15",
        "address": "4a Calle 5-67 Zona 1, Ciudad de Guatemala",
        "phone": "55551234",
        "email": "jperez@bufete.demo",
    }

    resp = client.post("/api/v1/clients", json=payload, headers=_auth_headers(token))
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["dpi"] == "1234567890123"
    assert data["first_name"] == "Juan"
    assert data["last_name"] == "Pérez López"
    assert data["status"] == "ACTIVE"
    assert "id" in data


def test_create_client_duplicate_dpi(client: TestClient, db_session: Session):
    _create_admin(db_session, "c2")
    token = _get_token(client, "admin_c2")

    payload = {
        "first_name": "Maria",
        "last_name": "Garcia",
        "dpi": "9999999999999",
    }

    resp1 = client.post("/api/v1/clients", json=payload, headers=_auth_headers(token))
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/clients", json=payload, headers=_auth_headers(token))
    assert resp2.status_code == 400
    assert "DPI" in resp2.json()["detail"]


def test_create_client_invalid_dpi(client: TestClient, db_session: Session):
    _create_admin(db_session, "c3")
    token = _get_token(client, "admin_c3")

    payload = {
        "first_name": "Pedro",
        "last_name": "Ramirez",
        "dpi": "123",  # Too short
    }
    resp = client.post("/api/v1/clients", json=payload, headers=_auth_headers(token))
    assert resp.status_code == 422


def test_list_clients(client: TestClient, db_session: Session):
    _create_admin(db_session, "c4")
    token = _get_token(client, "admin_c4")

    # Create two clients
    for i in range(2):
        client.post(
            "/api/v1/clients",
            json={
                "first_name": f"Cliente{i}",
                "last_name": "Test",
                "dpi": f"100000000000{i}",
            },
            headers=_auth_headers(token),
        )

    resp = client.get("/api/v1/clients", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 2


def test_get_client_by_id(client: TestClient, db_session: Session):
    _create_admin(db_session, "c5")
    token = _get_token(client, "admin_c5")

    create_resp = client.post(
        "/api/v1/clients",
        json={"first_name": "Carlos", "last_name": "Mendez", "dpi": "2000000000001"},
        headers=_auth_headers(token),
    )
    assert create_resp.status_code == 201
    client_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/v1/clients/{client_id}", headers=_auth_headers(token))
    assert get_resp.status_code == 200
    assert get_resp.json()["dpi"] == "2000000000001"


def test_update_client(client: TestClient, db_session: Session):
    _create_admin(db_session, "c6")
    token = _get_token(client, "admin_c6")

    create_resp = client.post(
        "/api/v1/clients",
        json={"first_name": "Ana", "last_name": "Fuentes", "dpi": "3000000000001"},
        headers=_auth_headers(token),
    )
    client_id = create_resp.json()["id"]

    upd_resp = client.put(
        f"/api/v1/clients/{client_id}",
        json={"profession": "Abogada", "marital_status": "CASADA"},
        headers=_auth_headers(token),
    )
    assert upd_resp.status_code == 200
    assert upd_resp.json()["profession"] == "Abogada"


def test_delete_client_logical(client: TestClient, db_session: Session):
    _create_admin(db_session, "c7")
    token = _get_token(client, "admin_c7")

    create_resp = client.post(
        "/api/v1/clients",
        json={"first_name": "Luis", "last_name": "Gomez", "dpi": "4000000000001"},
        headers=_auth_headers(token),
    )
    client_id = create_resp.json()["id"]

    del_resp = client.delete(
        f"/api/v1/clients/{client_id}", headers=_auth_headers(token)
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "INACTIVE"


def test_get_client_not_found(client: TestClient, db_session: Session):
    _create_admin(db_session, "c8")
    token = _get_token(client, "admin_c8")

    resp = client.get("/api/v1/clients/nonexistent-uuid", headers=_auth_headers(token))
    assert resp.status_code == 404


def test_list_clients_unauthenticated(client: TestClient):
    resp = client.get("/api/v1/clients")
    assert resp.status_code == 401
