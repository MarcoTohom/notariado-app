"""Seed script for Phase 2 demo accounts in accordance with Section 45 of PROJECT_SPEC.md."""

from app.core.roles import RoleEnum, UserStatusEnum
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User

DEMO_USERS = [
    {
        "username": "admin",
        "email": "admin@bufetenotarial.demo",
        "full_name": "Administrador Principal de Sistemas",
        "password": "Admin123!",
        "role": RoleEnum.ADMINISTRADOR.value,
        "status": UserStatusEnum.ACTIVE.value,
    },
    {
        "username": "notario.demo",
        "email": "notario@bufetenotarial.demo",
        "full_name": "Lic. Marco Antonio Lares (Abogado y Notario)",
        "password": "Notario123!",
        "role": RoleEnum.ABOGADO_NOTARIO.value,
        "status": UserStatusEnum.ACTIVE.value,
    },
    {
        "username": "auxiliar.demo",
        "email": "auxiliar@bufetenotarial.demo",
        "full_name": "Auxiliar Jurídico de Protocolo",
        "password": "Auxiliar123!",
        "role": RoleEnum.AUXILIAR.value,
        "status": UserStatusEnum.ACTIVE.value,
    },
    {
        "username": "adminfin.demo",
        "email": "finanzas@bufetenotarial.demo",
        "full_name": "Encargado de Administración y Cobros",
        "password": "Finanzas123!",
        "role": RoleEnum.ADMINISTRACION.value,
        "status": UserStatusEnum.ACTIVE.value,
    },
]


def seed_demo_users():
    db = SessionLocal()
    try:
        created_count = 0
        updated_count = 0
        for data in DEMO_USERS:
            existing = db.query(User).filter(User.username == data["username"]).first()
            if not existing:
                user = User(
                    username=data["username"],
                    email=data["email"],
                    full_name=data["full_name"],
                    password_hash=get_password_hash(data["password"]),
                    role=data["role"],
                    status=data["status"],
                )
                db.add(user)
                created_count += 1
            else:
                existing.full_name = data["full_name"]
                existing.role = data["role"]
                existing.status = data["status"]
                existing.password_hash = get_password_hash(data["password"])
                updated_count += 1
        db.commit()
        print(
            f"[OK] Cuentas demo sembradas: {created_count} creadas, {updated_count} actualizadas."
        )
    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Error al sembrar usuarios: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_users()
