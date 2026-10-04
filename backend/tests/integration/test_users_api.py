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
