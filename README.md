# Sistema de Borradores de Escrituras Públicas y Validación Documental Notarial

> **Proyecto de Graduación 2**
> **Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación**
> **Universidad Mariano Gálvez de Guatemala (UMG)**
> **Investigador:** Marco Antonio Lares Tohom
> **Línea Base:** 240 minutos → **Meta Experimental:** 60 minutos por escritura

---

## 1. Descripción y Objetivo

Este sistema es una solución tecnológica integral orientada a bufetes jurídicos y notariales de la Ciudad de Guatemala. Permite estructurar datos de clientes y expedientes, reutilizar plantillas notariales en formato DOCX mediante marcadores Jinja2, ejecutar un **motor de reglas de consistencia jurídica (RULE-001 a RULE-020)** y generar borradores limpios sin placeholders residuales, todo bajo un entorno local offline sin costos de licenciamiento ($0).

---

## 2. Pila Tecnológica (Stack)

* **Backend:** Python 3.12+ (probado en Python 3.14), FastAPI, SQLAlchemy 2.x, Alembic, SQLite, Pydantic v2, PyJWT, Argon2-cffi, python-docx, docxtpl, pandas, openpyxl, pypdf, pytest, Ruff.
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios, React Router 6, React Hook Form + Zod, TanStack Query, Vitest + React Testing Library.
* **Automatización:** Scripts PowerShell nativos para Windows 10/11 (`dev.ps1`, `test.ps1`, `seed.ps1`, `backup.ps1`).

---

## 3. Requisitos del Sistema

1. **Sistema Operativo:** Windows 10 o Windows 11 (64-bit).
2. **Python:** 3.12 o superior instalado y disponible en el PATH del sistema.
3. **Node.js:** Versión 18 o superior con `npm`.
4. **Git:** Para control de versiones local.

---

## 4. Instalación Rápida

1. **Clonar o abrir el repositorio:**
   ```powershell
   cd C:\git\apps\notariado-app
   ```

2. **Configurar el Backend:**
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\pip install -r requirements.txt
   .\.venv\Scripts\alembic upgrade head
   cd ..
   ```

3. **Poblar usuarios iniciales (seed):**
   ```powershell
   .\scripts\seed.ps1
   ```

4. **Configurar el Frontend:**
   ```powershell
   cd frontend
   npm install
   cd ..
   ```

---

## 5. Ejecución del Sistema

Para arrancar el backend y frontend en un solo comando:
```powershell
.\scripts\dev.ps1
```
* **Frontend:** http://127.0.0.1:5173
* **Backend API:** http://127.0.0.1:8000
* **Documentación Swagger / OpenAPI:** http://127.0.0.1:8000/api/v1/docs
* **Endpoint de Salud:** http://127.0.0.1:8000/api/v1/health

---

## 6. Pruebas Automatizadas y Calidad

```powershell
.\scripts\test.ps1
```

---

## 7. Roadmap de Fases del Proyecto

### FASE 1 — Monolito Modular Base — COMPLETADA (commit 209c9cb)

Objetivo: Andamiaje del proyecto, configuración de entorno y CI mínima viable.

| Componente | Estado | Detalle |
|---|---|---|
| Estructura de directorios | OK | backend/, frontend/, docs/, scripts/, .agents/ |
| FastAPI + SQLAlchemy 2.x | OK | App principal con lifespan, sesiones, pool configurado |
| SQLite + Alembic | OK | Migraciones versionadas |
| Modelos base (Base, IdentifiableMixin) | OK | UUID primario, created_at, updated_at |
| Endpoint /health | OK | Salud del sistema: API, DB y version |
| React 18 + Vite + Tailwind | OK | Frontend scaffolded con Lucide, Axios, TypeScript |
| Navbar y sistema de rutas | OK | Componente Navbar.tsx con navegacion basica |
| Scripts PowerShell | OK | dev.ps1, test.ps1, backup.ps1 |
| Suite de pruebas inicial | OK | test_health.py, test_db.py, test_config.py |
| .gitignore, .env.example | OK | Configuracion de entorno documentada |
| Documentacion inicial (docs/) | OK | Arquitectura, scrum, especificacion |

---

### FASE 2 — Autenticacion, RBAC y Modelos de Dominio — COMPLETADA (commit 67a67d3)

Objetivo: Sistema de identidad completo con JWT + Argon2, control de acceso basado en roles y modelos de dominio notarial.

#### Backend — Seguridad e Identidad

| Componente | Estado | Detalle |
|---|---|---|
| security.py — Argon2 + JWT | OK | Hash Argon2id (time=3, mem=64MB, par=4), tokens HS256 |
| roles.py — RBAC granular | OK | 4 roles: ADMINISTRADOR, ABOGADO_NOTARIO, AUXILIAR, ADMINISTRACION |
| Matriz de permisos | OK | ~40 permisos granulares (users, clients, cases, templates, documents) |
| deps.py — Dependencias FastAPI | OK | get_current_user, require_permission inyectables |
| POST /auth/login | OK | Autenticacion con username/password, retorna JWT + perfil |
| POST /auth/logout | OK | Registro de cierre de sesion en auditoria |
| GET /auth/me | OK | Perfil del usuario autenticado |

#### Backend — Gestion de Usuarios

| Componente | Estado | Detalle |
|---|---|---|
| Modelo User (SQLAlchemy) | OK | username, email, full_name, password_hash, role, status, last_login |
| user_service.py | OK | CRUD completo: create_user, update_user, delete_user_logical, get_users |
| GET /users | OK | Listado paginado con filtros por busqueda, rol y estado |
| POST /users | OK | Creacion con validacion de unicidad (username, email) y rol |
| PUT /users/{id} | OK | Actualizacion parcial con auditoria de cambios |
| DELETE /users/{id} | OK | Baja logica (status = INACTIVE), protege auto-desactivacion |
| seed_users.py | OK | Genera usuarios demo sinteticos por cada rol |
| scripts/seed.ps1 | OK | Script PowerShell para ejecutar seed |

#### Backend — Modelos de Dominio Notarial

| Modelo | Estado | Campos clave |
|---|---|---|
| Client (persona individual) | OK | DPI 13 digitos string, NIT string, estado civil, profesion, nacionalidad |
| LegalEntity (persona juridica) | OK | NIT string, tipo sociedad, registro mercantil, representante legal FK Client |
| Case (expediente notarial) | OK | case_number EXP-YYYY-#####, 5 tipos de escritura, datos instrumento/protocolo |
| CaseParty (compareciente) | OK | Rol compareciente (VENDEDOR, COMPRADOR, etc.), FK Case + Client |
| AuditLog | OK | Trazabilidad: modulo, accion, usuario, timestamp, detalles |

#### Backend — Servicios y Esquemas Pydantic v2

| Archivo | Estado | Detalle |
|---|---|---|
| schemas/auth.py | OK | LoginRequest, TokenResponse, UserProfile |
| schemas/user.py | OK | UserCreate, UserUpdate, UserRead, UserListResponse |
| schemas/client.py | OK | ClientCreate, ClientUpdate, ClientRead con validacion DPI |
| schemas/case.py | OK | CaseCreate, CaseUpdate, CaseRead, CasePartyCreate |
| schemas/legal_entity.py | OK | LegalEntityCreate, LegalEntityUpdate, LegalEntityRead |
| schemas/audit.py | OK | AuditLogRead, AuditLogListResponse |
| client_service.py | OK | CRUD clientes con validacion DPI unico y busqueda |
| audit_service.py | OK | record_audit() centralizado |

#### Backend — Auditoria y Pruebas

| Componente | Estado | Detalle |
|---|---|---|
| GET /audit | OK | Listado paginado de logs de auditoria (solo ADMINISTRADOR) |
| Migracion Alembic 06f3bdb | OK | Tablas: users, audit_logs, clients, legal_entities, cases, case_parties |
| test_auth_api.py | OK | Login exitoso, fallido, token invalido, perfil autenticado |
| test_users_api.py | OK | CRUD completo de usuarios con autenticacion |
| test_audit_api.py | OK | Acceso a logs con y sin permisos |
| test_security.py | OK | Hash/verify Argon2, creacion y decodificacion de JWT |

#### Frontend — Autenticacion y UI

| Componente | Estado | Detalle |
|---|---|---|
| AuthContext.tsx | OK | Context global: user, token, login(), logout(), persistencia localStorage |
| LoginModal.tsx | OK | Modal de inicio de sesion con validacion, feedback de errores |
| UserManagementModal.tsx | OK | CRUD usuarios: listado, creacion, edicion, baja logica (solo ADMINISTRADOR) |
| Navbar.tsx (actualizado) | OK | Muestra usuario activo, rol, boton logout, acceso gestion usuarios |
| api.ts (actualizado) | OK | Servicios authAPI, usersAPI con interceptores de token |
| types/index.ts (actualizado) | OK | Tipos User, LoginRequest, TokenResponse, Client, Case, LegalEntity |

---

### FASE 3 — Gestion de Clientes y Expedientes — COMPLETADA (commits 5d745a5, PENDIENTE_HASH)

Objetivo: CRUD completo de clientes (personas individuales y juridicas) y expedientes notariales con UI.

#### Backend — API REST (commit 5d745a5, endurecido con lint/format en esta entrega)

| Componente | Estado | Detalle |
|---|---|---|
| Endpoints /clients | OK | GET/POST/PUT/DELETE paginado con busqueda por nombre, DPI o NIT |
| Endpoints /legal-entities | OK | CRUD con representante legal vinculado a cliente individual |
| Endpoints /cases | OK | CRUD con correlativo EXP-YYYY-##### automatico |
| Endpoints /cases/{id}/parties | OK | POST/DELETE de comparecientes con rol |
| client_service.py / case_service.py / legal_entity_service.py | OK | Logica de negocio, auditoria y validaciones |
| test_clients_api.py / test_cases_api.py | OK | Pruebas de integracion del ciclo completo |
| Calidad (ruff check + ruff format) | OK | Corregidos F821/F401/I001/DTZ005 heredados del commit base |

#### Frontend — Vistas React (esta entrega)

| Componente | Estado | Detalle |
|---|---|---|
| React Router 6 + RequireAuth | OK | Rutas /clientes y /expedientes protegidas por sesion y permiso granular |
| ClientsPage | OK | Pestañas individuales/juridicas, busqueda debounced, paginacion, baja logica con confirmacion |
| ClientFormModal | OK | RHF + Zod: mascara DPI 13 digitos, validacion NIT/email/fecha, DPI inmutable en edicion |
| LegalEntityFormModal | OK | Datos registrales (registro, folio, libro) y representante legal con autocompletado |
| CasesPage | OK | Filtros por tipo/estado, busqueda, paginacion, cancelacion con confirmacion |
| CaseFormModal | OK | Apertura con constructor de comparecientes iniciales (cliente + rol + notas) |
| CaseDetailModal | OK | Ficha del expediente, agregar/quitar comparecientes, cambio de estado |
| ClientSearchSelect | OK | Autocompletado de clientes por nombre/DPI reutilizable en formularios |
| TanStack Query | OK | Cacheo, invalidacion y estados de carga de las consultas API |
| Vitest + React Testing Library | OK | 25 pruebas: invariantes DPI/NIT (validators) y formulario de cliente |
| scripts/test.ps1 | OK | Ahora ejecuta ruff, pytest, vitest y build de produccion |

**Verificacion E2E manual ejecutada:** login demo -> alta de cliente (DPI 2345678901202) -> alta de persona juridica con representante legal -> apertura de expediente EXP-2026-00001 con compareciente COMPRADOR -> gestion de comparecientes y estado desde el modal de detalle.

---

### FASE 4 — Plantillas DOCX y Motor de Reglas — PENDIENTE

Objetivo: Carga de plantillas .docx con Jinja2, extraccion lexica de variables y motor de consistencia documental (RULE-001 a RULE-020).

| Tarea | Estado |
|---|---|
| Modelo Template y TemplateVersion | Pendiente |
| Endpoint POST /templates (carga de archivo) | Pendiente |
| Extraccion de variables Jinja2 (docx-template skill) | Pendiente |
| Motor de reglas RULE-001 a RULE-020 | Pendiente |
| Endpoint POST /validations/run | Pendiente |
| Vista React: TemplatesPage | Pendiente |
| Pruebas del motor de reglas | Pendiente |

---

### FASE 5 — Generacion de Borradores DOCX — PENDIENTE

Objetivo: Generacion verificada de borradores, historial de versiones, descarga y validacion de placeholders residuales.

| Tarea | Estado |
|---|---|
| Modelo Document y DocumentVersion | Pendiente |
| Endpoint POST /documents/generate | Pendiente |
| Verificacion post-generacion (sin variables residuales) | Pendiente |
| Historial de versiones con trazabilidad | Pendiente |
| Endpoint GET /documents/{id}/download | Pendiente |
| Vista React: DocumentsPage | Pendiente |
| Pruebas de generacion y verificacion DOCX | Pendiente |

---

### FASE 6 — Experimento de Medicion de Tiempos — PENDIENTE

Objetivo: Generar 100 casos sinteticos y medir reduccion de tiempo de revision (linea base 240 min, meta 60 min).

| Tarea | Estado |
|---|---|
| Generador de 100 casos sinteticos | Pendiente |
| Modulo de medicion de tiempos por etapa | Pendiente |
| Registro de resultados en CSV/Excel | Pendiente |
| Calculo estadistico (media, desv. estandar, IC 95%) | Pendiente |
| Reporte exportable (PDF/Excel) | Pendiente |
| Script .\scripts\experiment.ps1 | Pendiente |

---

## 8. Estructura del Repositorio

```text
notariado-app/
├── .agents/                    # Reglas e invariantes locales Antigravity
│   ├── rules/                  # Reglas notariales, de tesis y arquitectura
│   └── skills/                 # Skills para DOCX, validacion y experimentacion
├── backend/                    # API FastAPI, SQLAlchemy, SQLite
│   ├── alembic/                # Migraciones de base de datos
│   ├── app/
│   │   ├── api/v1/endpoints/   # auth.py, users.py, audit.py, health.py
│   │   ├── core/               # config.py, security.py, roles.py
│   │   ├── db/                 # Sesion y base SQLAlchemy
│   │   ├── models/             # User, Client, LegalEntity, Case, CaseParty, AuditLog
│   │   ├── repositories/       # Capa de acceso a datos
│   │   ├── rules/              # Motor de reglas RULE-001 a RULE-020
│   │   ├── schemas/            # Esquemas Pydantic v2
│   │   ├── services/           # user_service, client_service, audit_service
│   │   └── utils/              # seed_users.py
│   ├── tests/
│   │   ├── integration/        # test_auth_api, test_users_api, test_audit_api
│   │   └── unit/               # test_security, test_config
│   └── requirements.txt
├── frontend/                   # Interfaz React + TypeScript + Vite
│   └── src/
│       ├── components/         # Navbar, LoginModal, UserManagementModal, SystemHealthBadge
│       │   └── common/         # ClientSearchSelect, ConfirmDialog
│       ├── context/            # AuthContext
│       ├── features/           # dashboard/, clients/, cases/ (paginas y modales)
│       ├── lib/                # validators.ts (Zod), labels.ts (catalogos)
│       ├── services/           # api.ts (auth, users, clients, legal-entities, cases)
│       ├── test/               # setup Vitest + Testing Library
│       └── types/              # index.ts
├── docs/                       # Documentacion formal de arquitectura, scrum y tesis
├── scripts/                    # dev.ps1, test.ps1, seed.ps1, backup.ps1
├── AGENTS.md                   # Reglas maestras del proyecto (Antigravity)
└── README.md                   # Guia de inicio rapido y estado del proyecto
```

---

## 9. Historial de Commits

| Commit | Fase | Descripcion |
|---|---|---|
| 209c9cb | Fase 1 | Base modular: FastAPI, SQLite, Alembic, React, Tailwind, test suite |
| 67a67d3 | Fase 2 | Auth JWT/Argon2, RBAC, modelos de dominio, auditoria, seed, tests integracion |

---

> **Nota de tesis:** Los tiempos de revision se mediran empiricamente con 100 casos sinteticos en la Fase 6. La reduccion de 240 a 60 minutos es una meta experimental, no un resultado asumido a priori.
