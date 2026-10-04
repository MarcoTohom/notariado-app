from datetime import timedelta

import pytest

from app.core.roles import ROLE_PERMISSIONS, RoleEnum, get_permissions_for_role
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)


def test_argon2_hashing_and_verification():
    raw_pass = "SecretoNotarial2026!"
    hashed = get_password_hash(raw_pass)

    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("PasswordErronea!", hashed) is False


def test_jwt_creation_and_decoding():
    user_id = "test-uuid-1234-5678"
    claims = {"role": "ABOGADO_NOTARIO", "username": "notario.test"}
    token = create_access_token(subject=user_id, extra_claims=claims)

    decoded = decode_access_token(token)
    assert decoded["sub"] == user_id
    assert decoded["role"] == "ABOGADO_NOTARIO"
    assert decoded["username"] == "notario.test"
    assert "exp" in decoded


def test_jwt_expiration():
    user_id = "test-uuid-expired"
    # Token expired 10 minutes ago
    token = create_access_token(subject=user_id, expires_delta=timedelta(minutes=-10))

    import jwt

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_role_permissions_matrix():
    admin_perms = get_permissions_for_role("ADMINISTRADOR")
    assert "users:create" in admin_perms
    assert "audit:read" in admin_perms
    assert len(admin_perms) == len(ROLE_PERMISSIONS[RoleEnum.ADMINISTRADOR])

    notario_perms = get_permissions_for_role("ABOGADO_NOTARIO")
    assert "documents:generate" in notario_perms
    assert "users:create" not in notario_perms

    auxiliar_perms = get_permissions_for_role("AUXILIAR")
    assert "clients:create" in auxiliar_perms
    assert "quotes:create" not in auxiliar_perms

    invalid_perms = get_permissions_for_role("ROL_INEXISTENTE")
    assert invalid_perms == []
