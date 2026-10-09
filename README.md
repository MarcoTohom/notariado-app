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

* **Backend:** Python 3.12+ (referencia estructural verificada con 3.12.14), FastAPI, SQLAlchemy 2.x, Alembic, SQLite, Pydantic v2, PyJWT, Argon2-cffi, python-docx, docxtpl, pandas, openpyxl, pypdf, pytest, Ruff.
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios, React Router 6, React Hook Form + Zod, TanStack Query, Vitest + React Testing Library.
* **Automatización:** Scripts PowerShell nativos para Windows 10/11 (`dev.ps1`, `test.ps1`, `seed.ps1`, `backup.ps1`).

---

## 3. Requisitos del Sistema

1. **Sistema Operativo:** Windows 10 o Windows 11 (64-bit).
2. **Python:** 3.12 o superior instalado y disponible en el PATH del sistema.
3. **Node.js:** Versión 22.13 o superior con `npm` (referencia verificada con 24.19.0 y npm 11.17.0).
4. **Git:** Para control de versiones local.

---

## 4. Instalación Rápida

Desde la carpeta del repositorio:

```powershell
.\scripts\setup.ps1 -E2E
.\scripts\test.ps1 -E2E
.\scripts\seed.ps1
.\scripts\dev.ps1
```

`setup.ps1` instala las versiones verificadas, prepara Chromium cuando se solicita `-E2E` y crea `.env` solo si falta. No aplica migraciones ni modifica datos; puede repetirse. `seed.ps1` aplica migraciones y restablece las cuentas demo. Para una instalación existente, ejecutar el sembrador únicamente si se desean esos usuarios sintéticos.

La [guía de instalación](docs/installation.md) explica cómo indicar otra ruta de Python, configurar las rutas locales y verificar el arranque. El [índice documental](docs/README.md) reúne las guías técnicas y académicas; el [mapa de módulos](docs/modules.md) permite localizar pantallas, API, servicios y pruebas.

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

La [referencia estructural del 8 de octubre de 2026](docs/testing/BASELINE_ESTRUCTURAL.md) registra el entorno verificado, los resultados, los contratos iniciales y las limitaciones de cobertura para la reorganización.

La [fase estructural 1](docs/testing/FASE_1_ESTRUCTURAL.md) registra la instalación nueva/repetida y los scripts verificados en Windows PowerShell 5.1, con 260 pruebas backend, 85 frontend y un E2E aprobados.

La [fase estructural 3](docs/testing/FASE_3_ESTRUCTURAL.md) registra la separación frontend de API, tipos y composición: 102 pruebas frontend, un E2E, lint, tipos y compilación aprobados; contratos, rutas y permisos conservados.

La [fase estructural 4](docs/testing/FASE_4_ESTRUCTURAL.md) registra componentes comunes de modal, mensajes, carga y badges, y la división de controles y editor: 111 pruebas frontend, dos E2E, lint, tipos y compilación aprobados.

```powershell
.\scripts\test.ps1
```

---

## 7. Roadmap de Fases del Proyecto

La reorganización de archivos, configuración y documentación tiene un [plan de mejora estructural](docs/PLAN_MEJORA_ESTRUCTURAL.md) con fases 0–7, entregables y criterios de cierre. Complementa las fases funcionales de la tesis que se describen a continuación.

El estado del código revisado el **8 de octubre de 2026** se resume en el [mapa de módulos](docs/modules.md):

| Alcance funcional | Estado actual |
|---|---|
| Fases 1–7 | Módulos de base, seguridad, expedientes, campos, plantillas, reglas y borradores implementados |
| Fase 8: ingesta XLSX/CSV/PDF | Prevista; los adjuntos actuales se guardan y descargan |
| Fase 9: administración financiera | Prevista |
| Fase 10: QA integral | Pruebas disponibles; los E2E actuales cubren campos dinámicos y formularios/modales compartidos |
| Fase 11: medición de tesis | Módulo implementado; la reducción temporal requiere el experimento registrado |

Los apartados siguientes conservan el historial de entregas y sus verificaciones reportadas. Las comprobaciones recientes y sus límites se encuentran en los informes de las [fases estructurales 0](docs/testing/BASELINE_ESTRUCTURAL.md), [1](docs/testing/FASE_1_ESTRUCTURAL.md), [2](docs/testing/FASE_2_ESTRUCTURAL.md), [3](docs/testing/FASE_3_ESTRUCTURAL.md) y [4](docs/testing/FASE_4_ESTRUCTURAL.md).

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

### FASE 3 — Gestion de Clientes y Expedientes — COMPLETADA (commits 5d745a5, 395259f)

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

### FASE 4 — Campos Dinámicos Tipados

Motor de 20 tipos con configuración versionada, DynamicForm (React Hook Form + Zod), persistencia por expediente, autocompletado de clientes, listas reordenables, cálculos Decimal y archivos con descarga autenticada.

Acceso: **Formularios** en la navegación o desde el detalle del expediente. [Guía, contratos y pruebas](docs/dynamic-fields.md).

```powershell
.\scripts\setup.ps1 -E2E
.\scripts\test.ps1 -E2E
```

La numeración sigue [MASTER_PLAN.md](docs/MASTER_PLAN.md), que define 11 fases.

### FASE 5 — Repositorio y Versionamiento de Plantillas DOCX — COMPLETADA (commit 5346bec)

Objetivo: Carga de plantillas .docx con marcadores Jinja2, extracción léxica automática de variables, versionamiento inmutable con una única versión vigente y render de prueba verificado.

#### Backend — API /templates y extractor léxico (skill docx-template)

| Componente | Estado | Detalle |
|---|---|---|
| Migración phase5_templates | OK | templates(+description, +status), template_versions(+file_path, +hash SHA-256, +size, +notes, +uploaded_by), template_fields(+auto_detected) |
| POST /templates | OK | Multipart: validación .docx, 10 MB máx., integridad OpenXML (zip, sin macros, sin XXE), almacenamiento UUID |
| POST /templates/{id}/versions | OK | Versiones inmutables v1, v2… jamás se sobrescriben |
| POST /templates/{id}/versions/{vid}/activate | OK | Una única versión ACTIVA por plantilla; las demás quedan ARCHIVADAS (solo lectura) |
| Extractor Jinja2 | OK | Regex de variables `{{ }}`, bucles `{% for %}`, condicionales `{% if %}` en párrafos y tablas |
| Sugerencia de tipos | OK | Heurística dpi/nit/currency/date/name/textarea/list/boolean + etiquetas legibles |
| Render de prueba (docxtpl) | OK | POST /versions/{vid}/preview con contexto 100% sintético y verificación python-docx de cero placeholders residuales (RULE-017) |
| GET /templates, GET /templates/{id}, DELETE /templates/{id} | OK | Listado paginado, detalle con versiones y campos, baja lógica conservando historial |
| test_jinja_extraction.py | OK | 24 pruebas unitarias: extracción, tipos, contexto sintético, residuales, sanitización |
| test_templates_api.py | OK | 9 pruebas de integración: flujo completo, seguridad de carga, RBAC, activación única, preview |

#### Frontend — Vista TemplatesPage

| Componente | Estado | Detalle |
|---|---|---|
| TemplatesPage | OK | Búsqueda debounced, filtro por tipo de escritura, paginación, baja lógica con confirmación |
| TemplateUploadModal | OK | RHF + Zod: nombre obligatorio, validación de archivo .docx (extensión, 10 MB) incluso con metadatos inválidos |
| TemplateDetailModal | OK | Historial de versiones con hash/tamaño/notas, campos detectados, activación, subida de nueva versión |
| Render de prueba en UI | OK | Botón "Probar render" con resultado (cero placeholders) y descarga del DOCX generado |
| Vitest | OK | 8 pruebas del modal de carga (validadores de archivo y FormData) |

**Verificación E2E ejecutada:** carga vía UI de plantilla sintética (14 variables detectadas con tipos correctos) → activación v1 → render de prueba con bucle `{% for testigo %}` y condicional `{% if %}` → descarga del DOCX sin placeholders residuales.

---

### FASE 6 — Motor de Reglas Notariales (RULE-001..RULE-020) — COMPLETADA (commit 5f2cb1a)

Objetivo: Motor de consistencia documental que contrasta los valores del expediente contra las fichas maestras de clientes y la normativa notarial guatemalteca, con panel interactivo de inconsistencias.

#### Backend — app/rules/ + API /validations

| Componente | Estado | Detalle |
|---|---|---|
| Motor de 20 reglas | OK | Estructurales (001-003), consistencia cruzada con ficha maestra (004-006, 020), fechas/montos (007-008), registrales RGP (009-011), geográficas (012-013), incisos (014-016), placeholders (017), aritmética (018), adjuntos (019) |
| Conversor número→letras | OK | Español hasta 999,999,999 + montos con centavos XX/100 (RULE-008, Art. 30 Código de Notariado) |
| Catálogo geográfico GT | OK | 22 departamentos con municipios; RULE-012 error si no existe, RULE-013 error si el municipio es de otro departamento / warning si no consta |
| POST /validations/run | OK | Evalúa valores almacenados o enviados (validar antes de guardar); respuesta con severidad, valor actual vs. esperado y ubicación |
| GET /validations/catalog /cases/{id} /cases/{id}/latest | OK | Catálogo de reglas, historial de corridas y última corrida por expediente |
| Persistencia validation_runs | OK | Migración phase6_rules: hallazgos completos en JSON para trazabilidad |
| Auditoría VALIDATE | OK | Bitácora con conteos por severidad, sin datos sensibles |
| Corrección de integración Fase 5 | OK | Campos lista auto-detectados ahora registran subcampos en options_json (compatibilidad con FieldDefinition de Fase 4) |
| 65 pruebas nuevas | OK | 20 number_words + 24 motor (contextos fabricados) + 9 integración API + 2 ajustes regresión |

#### Frontend — Panel de Inconsistencias

| Componente | Estado | Detalle |
|---|---|---|
| FindingsPanel | OK | Severidad con badges, mensaje, valor actual vs. esperado, ubicación, filtros por nivel, estado limpio |
| CaseValidationModal | OK | Selector de formulario/versión, ejecución del motor, resumen de corrida actual vs. última, acceso desde Expedientes |
| "Ir al campo" | OK | Navega al formulario dinámico del expediente (`/formularios?expediente=`) |
| Corrección Reglas de Hooks | OK | useMutation tras return anticipado en CaseValidationModal y TemplateDetailModal (crash de runtime) |
| Vitest FindingsPanel | OK | 6 pruebas: conteos, filtrado, comparación de valores, acción "Ir al campo" |

**Verificación E2E ejecutada:** expediente EXP-2026-00001 con DPI discordante deliberado → el panel muestra RULE-004 (CRITICAL, 2345678901299 vs. 2345678901202), RULE-010 y RULE-011 (datos registrales ausentes) con filtros funcionando y persistencia de la corrida.

---

### FASE 7 — Generación Verificada de Borradores DOCX — COMPLETADA (commit 1ce014b)

Objetivo: Generación de borradores con docxtpl en backend, verificación de cero placeholders residuales, historial inmutable con trazabilidad completa y descarga autenticada.

#### Backend — DocumentGenerationService + API /documents

| Componente | Estado | Detalle |
|---|---|---|
| Modelos Document y DocumentVersion | OK | Migración phase7_documents: snapshot de datos, hash SHA-256, tamaño, validation_status, residual_variables |
| Constructor de contexto Jinja2 | OK | Mapeo clave plana → docx_variable: anidados (comprador.dpi), colecciones {% for %}, omisión de None |
| POST /documents/generate | OK | Plantilla ACTIVA automática por tipo de escritura o versión explícita; render docxtpl en backend |
| Bloqueo por CRITICAL (spec §39) | OK | El motor de reglas se ejecuta antes de generar: hallazgos CRITICAL → 422 con detalle de hallazgos |
| ChainableUndefined | OK | Datos parciales (p. ej. vendedor ausente) renderizan vacío en lugar de abortar el render |
| Verificación post-generación (US-07.2) | OK | python-docx inspecciona el archivo: placeholders residuales → estado ERROR_PLACEHOLDERS_PENDIENTES |
| Historial inmutable (US-07.3) | OK | Versiones v1, v2… con autor, notas, hash y estado; jamás se sobrescriben |
| GET /documents, /documents/{id}, /versions/{id}/download | OK | Listado por expediente, detalle con versiones, descarga autenticada |
| 14 pruebas nuevas | OK | 7 contexto (unit) + 7 integración: flujo completo, bloqueo CRITICAL, datos parciales, historial, RBAC |

#### Frontend — Generación y Repositorio de Borradores

| Componente | Estado | Detalle |
|---|---|---|
| GenerateDocumentModal | OK | Desde Expedientes: plantilla ACTIVA preseleccionada, notas de versión, resultado con verificación |
| DocumentsPage (/documentos) | OK | Repositorio global de borradores con paginación y estado |
| DocumentDetailModal + DocumentVersionsList | OK | Historial con badges de verificación, hash, tamaño, notas y descarga autenticada |
| Vitest DocumentVersionsList | OK | 4 pruebas: estado vacío, verificada, placeholders pendientes, historial múltiple |

**Verificación E2E principal de tesis ejecutada:** expediente con datos capturados → generación vía UI → versión v1 con estado OK y cero placeholders → descarga del DOCX con datos del expediente sustituidos (compareciente, DPI, precio, bucle de testigos) y secciones sin datos renderizadas vacías.

---

### FASE 11 — Experimento de Medición de Tiempos (100 Casos Sintéticos) — MÓDULO IMPLEMENTADO (commit b8ca802)

Objetivo: corpus experimental estratificado, medición cronometrada TRADITIONAL vs SYSTEM por etapas y estadística real para la validación de la hipótesis (línea base 240 min, meta experimental 60 min).

#### Backend — Corpus + Medición + Estadística

| Componente | Estado | Detalle |
|---|---|---|
| Generador de 100 casos sintéticos | OK | 20 por tipo de escritura; 10 íntegros + 10 anómalos por tipo (una anomalía del plan por caso) |
| Alineación corpus↔motor | OK | Prueba científica: cada caso íntegro produce 0 hallazgos y cada anomalía dispara EXACTAMENTE las reglas esperadas (50 combinaciones verificadas) |
| Hallazgos esperados registrados | OK | expected_findings por caso → cómputo automático de errores detectados/omitidos en método SYSTEM |
| Datos 100% sintéticos | OK | Faker es_ES + DPIs/NITs sintéticos con formato válido; regeneración idempotente del corpus |
| Cronómetro por corridas y etapas | OK | test_executions (started/finished/duration) + time_measurements (DETECCION/CORRECCION/GENERACION); una corrida abierta por usuario |
| Estadística real con scipy | OK | Media, σ, IC95 por método; Shapiro-Wilk; t de Student pareada o Wilcoxon (α=0.05); reducción con fórmula oficial |
| Exportación Capítulo IV | OK | GET /experiment/export.xlsx (pandas+openpyxl, hojas Ejecuciones+Resumen) y /export.csv |
| Script experiment.ps1 | OK | Genera el corpus contra la BD local sin requerir servidor |
| Permisos experiment:read/execute | OK | Integrados a la matriz RBAC (ADMINISTRADOR/ABOGADO_NOTARIO ejecutan; AUXILIAR/ADMINISTRACION leen) |
| Correcciones del motor detectadas | OK | Emparejamiento posicional multi-rol (contrayentes), exclusión de duplicados en cruces, ordinal único por inciso, par capital_monto/capital_letras en RULE-008 |
| 27 pruebas nuevas | OK | 13 alineación corpus + 3 número→letras extra + 11 integración API (corpus, ciclo, stats, export, RBAC) |

#### Frontend — Módulo Tesis (/tesis)

| Componente | Estado | Detalle |
|---|---|---|
| ExperimentPage | OK | Generación del corpus, tabla con filtros tipo/condición, botones Sistema/Tradicional por caso |
| Cronómetro en vivo | OK | Panel de corrida activa con mm:ss, etapas cronometradas y finalización (conteo manual en TRADITIONAL, automático en SYSTEM) |
| ExperimentStatsCards | OK | Línea base, μ por método con σ e IC95, reducción %, detección vs omisión, contraste de hipótesis, exportación |
| Navbar "Módulo Tesis" | OK | Habilitado con permiso experiment:read |
| Vitest | OK | 4 pruebas del dashboard (medias, reducción, decisión H₀, vacíos sin datos ficticios, exportación) |

**Verificación E2E ejecutada:** corpus real de 100 casos en BD → corrida SYSTEM (41s, 1 detectado/0 omitidos automático) → corrida TRADITIONAL (48s, conteos manuales) → baseline cambia a MEDICIONES y reducción computada desde datos reales → CSV exportado con todas las columnas.

**Nota metodológica:** la reducción mostrada en el dashboard deriva siempre de corridas reales registradas. Los tiempos del experimento formal (100 casos) se registran ejecutando las corridas desde el módulo; el sistema jamás inserta valores ficticios.

---

---

## 8. Estructura del Repositorio

```text
notariado-app/
├── .agents/                    # Reglas y procedimientos locales
├── backend/
│   ├── alembic/                # Migraciones versionadas
│   ├── app/
│   │   ├── api/v1/endpoints/   # Entradas HTTP por módulo
│   │   ├── core/              # Configuración, seguridad y permisos
│   │   ├── db/                # Base y sesiones SQLAlchemy
│   │   ├── models/            # Dominio, versiones, validación y experimento
│   │   ├── repositories/      # Solo inicializador; pendiente de resolver en fase 5
│   │   ├── rules/             # Motor RULE-001..020 y catálogos
│   │   ├── schemas/           # Contratos Pydantic
│   │   ├── services/          # Coordinación y persistencia
│   │   └── utils/             # seed_users.py y synthetic_data.py
│   ├── tests/                 # unit/ e integration/
│   ├── pyproject.toml         # Configuración Ruff y pytest
│   └── requirements*.txt      # Dependencias de ejecución/desarrollo y versiones fijadas
├── frontend/
│   ├── e2e/                   # Escenario Playwright de campos dinámicos
│   └── src/
│       ├── app/               # Proveedores, rutas y layout
│       ├── components/        # Navegación y UI común: modales, mensajes, carga y badges
│       ├── features/          # dashboard, auth, users, audit, clients, cases, fields,
│       │                      # templates, validation, documents y experiment;
│       │                      # API y tipos propios por funcionalidad
│       ├── lib/               # Validadores, etiquetas y formato
│       ├── shared/            # Cliente HTTP, errores comunes y CaseType
│       └── test/              # Preparación Vitest
├── docs/                      # Índice, guías, planificación, evidencia y antecedentes
├── scripts/                   # setup, dev, test, seed, backup, experiment y baseline
├── AGENTS.md                  # Reglas permanentes
└── README.md
```

Los archivos locales de SQLite, plantillas, adjuntos, borradores, respaldos y cachés se excluyen de Git. La [arquitectura](docs/architecture.md), el [mapa de módulos](docs/modules.md) y las [convenciones](docs/contributing.md) detallan responsabilidades actuales y la reorganización pendiente.

---

## 9. Historial de Commits

| Commit | Fase | Descripcion |
|---|---|---|
| a48ef71 | Estructural 0–1 | Referencia verificada, instalación repetible, dependencias fijadas y scripts Windows |
| 338d6b0 | Estructural 2 | Índice, arquitectura, mapa de módulos, convenciones y referencias documentales verificadas |
| da9d93b | Estructural 3 | API y tipos por funcionalidad, cliente HTTP compartido y composición de la aplicación |
| 209c9cb | Fase 1 | Base modular: FastAPI, SQLite, Alembic, React, Tailwind, test suite |
| 67a67d3 | Fase 2 | Auth JWT/Argon2, RBAC, modelos de dominio, auditoria, seed, tests integracion |
| 5d745a5 | Fase 3 | Backend: endpoints y servicios de clients, legal-entities, cases y parties |
| 395259f | Fase 3 | Frontend clientes/expedientes, RHF+Zod+TanStack Query, vitest, lint backend |
| a056427 | Fase 4 | Motor de 20 campos tipados, DynamicForm, persistencia por expediente, e2e Playwright |
| 5346bec | Fase 5 | Repositorio DOCX: carga, extractor Jinja2, versionamiento inmutable, activacion, preview |
| 5f2cb1a | Fase 6 | Motor RULE-001..020, numero->letras, catalogo GT, panel inconsistencias, validation_runs |
| 1ce014b | Fase 7 | Generacion docxtpl verificada, bloqueo por CRITICAL, historial inmutable, descarga |
| b8ca802 | Fase 11 | Corpus 100 casos, cronometro por etapas, estadistica scipy, dashboard y exportacion |

---

> **Nota de tesis:** Los tiempos de revision se mediran empiricamente con 100 casos sinteticos en la Fase 11. La reduccion de 240 a 60 minutos es una meta experimental, no un resultado asumido a priori.
