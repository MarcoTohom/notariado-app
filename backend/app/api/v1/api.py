from fastapi import APIRouter

from app.api.v1.endpoints import (
    audit,
    auth,
    cases,
    clients,
    documents,
    dynamic_fields,
    experiment,
    files,
    health,
    legal_entities,
    templates,
    users,
    validations,
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
api_router.include_router(
    templates.router, prefix="/templates", tags=["Plantillas DOCX"]
)
api_router.include_router(
    validations.router, prefix="/validations", tags=["Motor de Reglas Notariales"]
)
api_router.include_router(
    documents.router, prefix="/documents", tags=["Borradores DOCX"]
)
api_router.include_router(
    experiment.router, prefix="/experiment", tags=["Experimento de Tesis UMG"]
)
api_router.include_router(
    files.router, prefix="/files", tags=["Archivos del Sistema"]
)
