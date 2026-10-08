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
        "experiment:read",
        "experiment:execute",
        "files:read",
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
        "files:read",
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


def get_effective_permissions(role: str, overrides: dict | None = None) -> list[str]:
    """Returns permissions for role with granular grant/revoke overrides applied."""
    role_perms = set(get_permissions_for_role(role))
    if overrides:
        grant = set(overrides.get("grant", []))
        revoke = set(overrides.get("revoke", []))
        role_perms = (role_perms - revoke) | grant
    return sorted(role_perms)


def get_all_known_permissions() -> list[str]:
    """Returns union of all permissions defined in the RBAC matrix."""
    all_perms: set[str] = set()
    for perms in ROLE_PERMISSIONS.values():
        all_perms.update(perms)
    return sorted(all_perms)
