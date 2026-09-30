# ARQUITECTURA DEL SISTEMA: MONOLITO MODULAR LOCAL

## 1. Visión General y Principios
El sistema adopta un diseño de **Monolito Modular Local** que garantiza:
- **Autonomía Operativa:** Funcionamiento 100% desconectado de la nube en Windows 10/11.
- **Desacoplamiento Estricto:** Capas separadas para persistencia, modelos de dominio, validación semántica e interfaces de comunicación.
- **Rendimiento:** SQLite con `check_same_thread=False` y FastAPI asíncrono para tiempos de respuesta menores a 50 ms.

```text
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React 18 + TypeScript)           │
│   - SPA en Vite             - Tailwind CSS              │
│   - React Hook Form + Zod   - Axios HTTP Client         │
└────────────────────────────┬────────────────────────────┘
                             │ REST / JSON (CORS protegido)
┌────────────────────────────▼────────────────────────────┐
│                  BACKEND (FastAPI Monolito)             │
│   ├── app/core/config.py     (Pydantic Settings)        │
│   ├── app/db/session.py      (SQLAlchemy SessionLocal)  │
│   ├── app/api/v1/            (Routers y Endpoints)      │
│   ├── app/rules/             (Motor de Reglas Notarial) │
│   └── app/services/          (Renderizado y Negocio)    │
└────────────────────────────┬────────────────────────────┘
                             │ Engine SQLAlchemy 2.0
┌────────────────────────────▼────────────────────────────┐
│                    PERSISTENCIA LOCAL                   │
│   - Base de Datos: SQLite (backend/app.db)              │
│   - File Storage: backend/uploads/ y backend/generated/ │
└─────────────────────────────────────────────────────────┘
```