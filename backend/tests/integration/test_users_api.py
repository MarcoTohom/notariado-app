from app.core.security import create_access_token, get_password_hash
from app.models.user import User


def _create_admin_and_token(db_session):
    admin = User(
        username="admin_api_test",
        email="admin_api@bufetenotarial.demo",
        full_name="Admin Test API",
        password_hash=get_password_hash("AdminPass123!"),
        role="ADMINISTRADOR",
        status="ACTIVE",
    )
    db_session.add(admin)
    db_session.commit()
    token = create_access_token(
        subject=admin.id, extra_claims={"role": "ADMINISTRADOR"}
    )
    return admin, token


def test_admin_can_create_and_list_users(client, db_session):
    _admin, token = _create_admin_and_token(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    # Create new user
    new_user_data = {
        "username": "nuevo_notario",
        "email": "nuevo_notario@bufetenotarial.demo",
        "full_name": "Lic. Nuevo Notario",
        "password": "Password123!",
        "role": "ABOGADO_NOTARIO",
        "status": "ACTIVE",
    }
    create_resp = client.post("/api/v1/users", json=new_user_data, headers=headers)
    assert create_resp.status_code == 201
    created_id = create_resp.json()["id"]

    # List users
    list_resp = client.get("/api/v1/users", headers=headers)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert any(u["username"] == "nuevo_notario" for u in items)

    # Soft-delete user
    del_resp = client.delete(f"/api/v1/users/{created_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "INACTIVE"


def test_non_admin_cannot_create_user(client, db_session):
    auxiliar = User(
        username="auxiliar_test_api",
        email="auxiliar_api@bufetenotarial.demo",
        full_name="Auxiliar Test API",
        password_hash=get_password_hash("AuxPass123!"),
        role="AUXILIAR",
        status="ACTIVE",
    )
    db_session.add(auxiliar)
    db_session.commit()
    token = create_access_token(subject=auxiliar.id, extra_claims={"role": "AUXILIAR"})
    headers = {"Authorization": f"Bearer {token}"}

    # Attempting to create user without users:create permission
    resp = client.post(
        "/api/v1/users",
        json={
            "username": "hacker_user",
            "email": "hacker@test.com",
            "full_name": "Intento No Autorizado",
            "password": "Password123!",
            "role": "ADMINISTRADOR",
            "status": "ACTIVE",
        },
        headers=headers,
    )

    assert resp.status_code == 403


def test_permission_catalog_endpoint(client, db_session):
    """GET /users/meta/permissions retorna el catálogo de permisos."""
    _admin, token = _create_admin_and_token(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/users/meta/permissions", headers=headers)
    assert resp.status_code == 200
    catalog = resp.json()
    assert isinstance(catalog, list)
    assert "users:read" in catalog
    assert "clients:read" in catalog
    assert "experiment:read" in catalog
    assert "files:read" in catalog


def test_update_user_permission_overrides_grant_and_revoke(client, db_session):
    """Administrador asigna overrides (grant/revoke) y estos tienen efecto inmediato en la API."""
    _admin, token = _create_admin_and_token(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    # Crear usuario auxiliar
    aux = User(
        username="aux_overrides_test",
        email="aux_overrides@bufetenotarial.demo",
        full_name="Auxiliar Overrides",
        password_hash=get_password_hash("AuxPass123!"),
        role="AUXILIAR",
        status="ACTIVE",
    )
    db_session.add(aux)
    db_session.commit()

    # Por defecto AUXILIAR tiene clients:read pero NO templates:activate
    aux_token = create_access_token(subject=aux.id, extra_claims={"role": "AUXILIAR"})
    aux_headers = {"Authorization": f"Bearer {aux_token}"}

    # Verificar permiso original clients:read
    resp_clients = client.get("/api/v1/clients", headers=aux_headers)
    assert resp_clients.status_code == 200

    # Admin revoca clients:read y concede users:read via overrides
    update_payload = {
        "permission_overrides": {
            "grant": ["users:read"],
            "revoke": ["clients:read"],
        }
    }
    update_resp = client.put(
        f"/api/v1/users/{aux.id}", json=update_payload, headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["permission_overrides"] == {
        "grant": ["users:read"],
        "revoke": ["clients:read"],
    }

    # Ahora clients:read debe fallar con 403 (revocado)
    resp_clients_revoked = client.get("/api/v1/clients", headers=aux_headers)
    assert resp_clients_revoked.status_code == 403

    # Y users:read debe permitirse (concedido)
    resp_users_granted = client.get("/api/v1/users", headers=aux_headers)
    assert resp_users_granted.status_code == 200

    # /auth/me del usuario debe reflejar users:read y no clients:read
    resp_me = client.get("/api/v1/auth/me", headers=aux_headers)
    assert resp_me.status_code == 200
    perms = resp_me.json()["permissions"]
    assert "users:read" in perms
    assert "clients:read" not in perms

    # Verificar que se registró auditoría con acción PERMISSION_CHANGE
    from app.models.audit import AuditLog

    audit_entry = (
        db_session.query(AuditLog)
        .filter(AuditLog.record_id == aux.id, AuditLog.action == "PERMISSION_CHANGE")
        .first()
    )
    assert audit_entry is not None


def test_admin_self_protection(client, db_session):
    """Administrador no puede degradar su propio rol ni desactivarse a sí mismo."""
    admin, token = _create_admin_and_token(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    # Intento de cambiar su propio rol a AUXILIAR
    resp_demote = client.put(
        f"/api/v1/users/{admin.id}",
        json={"role": "AUXILIAR"},
        headers=headers,
    )
    assert resp_demote.status_code == 400
    assert "No es posible retirar el rol ADMINISTRADOR" in resp_demote.json()["detail"]

    # Intento de desactivar su propia cuenta
    resp_deactivate = client.put(
        f"/api/v1/users/{admin.id}",
        json={"status": "INACTIVE"},
        headers=headers,
    )
    assert resp_deactivate.status_code == 400
    assert (
        "No es posible desactivar la propia cuenta" in resp_deactivate.json()["detail"]
    )
