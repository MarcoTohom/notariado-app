from enum import Enum


class RoleEnum(str, Enum):
    ADMINISTRADOR = "ADMINISTRADOR"
    ABOGADO_NOTARIO = "ABOGADO_NOTARIO"
    AUXILIAR = "AUXILIAR"
    ADMINISTRACION = "ADMINISTRACION"


class UserStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


# Complete granular permissions matrix defined in Section 6.3 of PROJECT_SPEC.md
ROLE_PERMISSIONS: dict[RoleEnum, set[str]] = {
    RoleEnum.ADMINISTRADOR: {
        "users:read",
        "users:create",
        "users:update",
        "users:delete",
        "clients:read",
        "clients:create",
        "clients:update",
        "clients:delete",
        "cases:read",
        "cases:create",
        "cases:update",
        "cases:delete",
        "templates:read",
        "templates:create",
        "templates:update",
        "templates:delete",
        "templates:activate",
        "documents:read",
        "documents:create",
        "documents:update",
        "documents:generate",
        "validations:read",
        "validations:execute",
        "quotes:read",
        "quotes:create",
        "quotes:update",
        "quotes:delete",
        "budgets:read",
        "budgets:create",
        "budgets:update",
        "charges:read",
        "charges:create",
        "charges:update",
        "payments:read",
        "payments:create",
        "reports:read",
        "audit:read",
    },
    RoleEnum.ABOGADO_NOTARIO: {
        "clients:read",
        "clients:create",
        "clients:update",
        "clients:delete",
        "cases:read",
        "cases:create",
        "cases:update",
        "cases:delete",
        "templates:read",
        "templates:create",
        "templates:update",
        "templates:activate",
        "documents:read",
        "documents:create",
        "documents:update",
        "documents:generate",
        "validations:read",
        "validations:execute",
        "quotes:read",
        "quotes:create",
        "quotes:update",
        "reports:read",
    },
    RoleEnum.AUXILIAR: {
        "clients:read",
        "clients:create",
        "clients:update",
        "cases:read",
        "cases:create",
        "cases:update",
        "templates:read",
        "documents:read",
        "documents:create",
        "documents:update",
        "validations:read",
        "validations:execute",
    },
    RoleEnum.ADMINISTRACION: {
        "clients:read",
        "cases:read",
        "quotes:read",
        "quotes:create",
        "quotes:update",
        "quotes:delete",
        "budgets:read",
        "budgets:create",
        "budgets:update",
        "charges:read",
        "charges:create",
        "charges:update",
        "payments:read",
        "payments:create",
        "reports:read",
    },
}


def get_permissions_for_role(role: str) -> list[str]:
    """Returns sorted list of permissions granted to a given role."""
    try:
        role_enum = RoleEnum(role)
        return sorted(ROLE_PERMISSIONS.get(role_enum, set()))
    except ValueError:
        return []
