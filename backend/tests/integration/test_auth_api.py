from app.core.security import get_password_hash
from app.models.user import User


def test_login_success_and_me_endpoint(client, db_session):
    # Ensure test user exists
    user = User(
        username="login_test_user",
        email="login_test@bufetenotarial.demo",
        full_name="Usuario de Prueba Login",
        password_hash=get_password_hash("Password123!"),
        role="ABOGADO_NOTARIO",
        status="ACTIVE",
    )
    db_session.add(user)
    db_session.commit()

    # 1. Test Login via JSON
    resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "login_test_user", "password": "Password123!"},
    )
    assert resp.status_code == 200
    token_data = resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 2. Test /auth/me with Bearer token
    me_resp = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["username"] == "login_test_user"
    assert me_data["role"] == "ABOGADO_NOTARIO"
    assert "documents:generate" in me_data["permissions"]


def test_login_invalid_password(client, db_session):
    user = User(
        username="user_bad_pass",
        email="badpass@bufetenotarial.demo",
        full_name="Usuario Password Invalida",
        password_hash=get_password_hash("CorrectPassword123!"),
        role="AUXILIAR",
        status="ACTIVE",
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "user_bad_pass", "password": "WrongPassword!"},
    )
    assert resp.status_code == 401


def test_me_unauthorized_without_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401
