from fastapi import APIRouter

from app.api.v1.endpoints import (
    audit,
    auth,
    cases,
    clients,
    dynamic_fields,
    health,
    legal_entities,
    users,
)

api_router = APIRouter()
api_router.include_router(
    dynamic_fields.router, prefix="/fields", tags=["Campos dinámicos"]
)

api_router.include_router(health.router, tags=["Salud del Sistema"])
api_router.include_router(
    auth.router, prefix="/auth", tags=["Autenticación y Sesiones"]
)
api_router.include_router(
    users.router, prefix="/users", tags=["Gestión de Usuarios y Roles"]
)
api_router.include_router(
    audit.router, prefix="/audit", tags=["Auditoría y Trazabilidad"]
)
api_router.include_router(
    clients.router, prefix="/clients", tags=["Clientes (Personas Individuales)"]
)
api_router.include_router(
    legal_entities.router, prefix="/legal-entities", tags=["Personas Jurídicas"]
)
api_router.include_router(
    cases.router, prefix="/cases", tags=["Expedientes Notariales"]
)
