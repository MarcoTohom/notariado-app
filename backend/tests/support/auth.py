"""Autenticación real de usuarios sintéticos para pruebas de integración."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User


def create_user(db_session: Session, suffix: str, role: str) -> User:
    return create_account(db_session, f"user_{suffix}", f"Usuario {suffix}", role)


def create_account(
    db_session: Session, username: str, full_name: str, role: str
) -> User:
    user = User(
        username=username,
        email=f"{username}@bufetenotarial.demo",
        full_name=full_name,
        password_hash=get_password_hash("Admin1234!"),
        role=role,
        status="ACTIVE",
    )
    db_session.add(user)
    db_session.commit()
    return user


def login_token(client: TestClient, username: str, password: str = "Admin1234!") -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
