from fastapi import APIRouter

from app.api.v1.endpoints import audit, auth, health, users

api_router = APIRouter()

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
