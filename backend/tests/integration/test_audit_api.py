from app.core.security import create_access_token, get_password_hash
from app.models.user import User


def test_audit_log_query(client, db_session):
    admin = User(
        username="admin_audit_tester",
        email="admin_audit@bufetenotarial.demo",
        full_name="Admin Audit Tester",
        password_hash=get_password_hash("AdminPass123!"),
        role="ADMINISTRADOR",
        status="ACTIVE",
    )
    db_session.add(admin)
    db_session.commit()
    token = create_access_token(
        subject=admin.id, extra_claims={"role": "ADMINISTRADOR"}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Query audit logs
    resp = client.get("/api/v1/audit", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
