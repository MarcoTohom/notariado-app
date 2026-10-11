# PLAN DE DESARROLLO — SIGUIENTES OBJETIVOS (v1.0)
**Sistema de Borradores de Escrituras Públicas — UMG**
**Fecha:** 2026-10-07 · **Base:** fases 1–7 y 11 completadas (ver `README.md` §7)

> **Documento de trabajo ejecutable.** Contiene el desglose técnico de los 8
> objetivos pendientes en paquetes de trabajo (WP) ordenados por dependencias,
> con contratos de API, archivos afectados, pruebas requeridas y criterios de
> aceptación. Está redactado para ser consumido directamente por el equipo o
> por agentes de IA: cada WP es auto-contenido y cita rutas y símbolos reales
> del repositorio.

---

## 0. Cómo ejecutar este plan (reglas de trabajo)

1. **Orden:** ejecutar los WP en el orden de la §3 (las dependencias están explícitas en cada WP).
2. **Metodología por WP:** backend → migración si aplica → pruebas backend → frontend → pruebas frontend → verificación E2E en navegador → actualizar `README.md` (roadmap) → commit de feature → commit de docs (ver §9).
3. **DoD obligatorio** (de `docs/scrum/DEFINITION_OF_DONE.md`): sin TODOs ni stubs, persistencia Alembic, validación Pydantic/Zod, UI funcional, pruebas al 100%, `ruff check` + `ruff format` limpios, `npm run test` y `npm run build` en verde, scripts Windows compatibles.
4. **Pipeline:** `.\scripts\test.ps1` debe terminar con exit 0 antes de cada commit.
5. **Invariantes que no se negocian:**
   - DPI y NIT siempre `string` (nunca enteros). Dinero siempre `Decimal`.
   - Nada de datos personales reales: solo sintéticos.
   - Contraseñas con Argon2; sin datos sensibles en logs ni en auditoría.
   - Versionamiento inmutable: no sobrescribir archivos ni versiones previas.
   - Offline total en Windows 10/11; generación DOCX solo en backend.
6. **Estado actual del código** (referencia rápida):
   - Backend FastAPI: `backend/app/{api,core,db,models,rules,schemas,services,utils}`.
   - Frontend React/TS: `frontend/src/{components,features,services,lib,types,context}` con rutas en `App.tsx` y guardián `RequireAuth` (permiso granular) y `useAuth().hasRole/hasPermission`.
   - Matriz RBAC: `backend/app/core/roles.py` (`ROLE_PERMISSIONS`).
   - Scripts: `scripts/{dev,test,seed,backup,experiment}.ps1`.

---

## 1. Resumen de objetivos → paquetes de trabajo

| WP | Objetivo del usuario | Estimación | Dependencias |
|---|---|---:|---|
| **WP-01** | Landing page profesional orientada al mercado legal (pública) | 5 pts | — |
| **WP-02** | Página inicial actual → sección solo-admin + seguimiento de fases | 3 pts | WP-01 |
| **WP-03** | Gestión de usuarios: editar rol, permisos y estado | 8 pts | — |
| **WP-04** | Módulo de evaluación de tesis visible solo para administradores | 2 pts | — |
| **WP-05** | Inventario y verificación de archivos del sistema + preview en modal | 8 pts | — |
| **WP-06** | Guía/tips: diferencia entre plantillas, borradores y expedientes | 3 pts | — |
| **WP-07** | Editor de borradores: formulario a la izquierda + preview en vivo a la derecha con incisos editables | 13 pts | — |
| **WP-08** | Atajos de teclado en el editor (Tab, Shift+Tab, etc.) con hints visibles | 5 pts | WP-07 |
| **Total** | | **47 pts** | |

**Orden recomendado de ejecución (3 sprints):**

```
Sprint A (UX pública y administración):  WP-01 → WP-02 → WP-04 → WP-03
Sprint B (Operación y guía):             WP-06 → WP-05
Sprint C (Editor de borradores):         WP-07 → WP-08
```

---

## 2. Convenciones del plan

- Rutas frontend nuevas en `frontend/src/features/<dominio>/`.
- Endpoints bajo `/api/v1/` con prefijo por módulo y tag OpenAPI en español.
- Migraciones Alembic en `backend/alembic/versions/` con id descriptivo (`wpXX_contenido.py`) encadenadas a la revisión anterior vigente (hoy: `phase11_experiment`).
- Cada WP cierra con: pruebas nuevas pasando, `test.ps1` en verde, `README.md` actualizado y 2 commits (feature + docs).

---

## 3. Paquetes de trabajo detallados

---

### WP-01 — Landing page profesional (pública, mercado legal)

**Objetivo:** reemplazar la home actual por una landing pública de marketing sobrio orientada a bufetes jurídicos y notarios de Guatemala.

**Estado actual:** `/` renderiza `DashboardPage` (panel técnico con estado del backend, scripts y roadmap). No existe landing pública.

**Diseño técnico:**

- **Solo frontend.** Nueva página `frontend/src/features/landing/LandingPage.tsx`.
- Pública (sin `RequireAuth`); si el usuario YA tiene sesión, mostrar CTA "Ir al panel" además de "Iniciar sesión".
- Contenido (español, tono legal sobrio, paleta existente slate/brand + acento dorado `notarial.gold`):
  1. **Hero:** propuesta de valor — "Borradores de escrituras públicas con validación documental automatizada" + CTA (Acceder / Conocer módulos).
  2. **Propuesta de valor en 3 tarjetas:** (a) Plantillas DOCX con variables Jinja2 y versionamiento inmutable; (b) Motor de 20 reglas notariales (DPI, NIT, finca/folio/libro, montos en letras Art. 30); (c) Borradores verificados sin placeholders residuales.
  3. **Cómo funciona** (flujo en 4 pasos): Expediente → Plantilla → Validación → Borrador DOCX.
  4. **Cifras del sistema:** 20 reglas, 5 tipos de escritura, 100 casos sintéticos (texto estático honesto; sin métricas inventadas).
  5. **Nota de cumplimiento:** herramienta de apoyo — no sustituye al Notario ni a los registros públicos (RGP, SAT, RENAP).
  6. **Footer** con datos académicos (UMG, Proyecto de Graduación).
- Sin imágenes externas (offline): iconografía `lucide-react` y composición tipográfica.

**Archivos:**

- Crear `frontend/src/features/landing/LandingPage.tsx`
- `frontend/src/App.tsx`: ruta `/` → `LandingPage` (sin guardia); el guardián actual se mantiene para el resto.
- `frontend/src/components/Navbar.tsx`: enlace "Panel" → `/`; ocultar enlaces de módulos sin sesión (ya implementado vía permisos).

**Pruebas:**

- `LandingPage.test.tsx` (Vitest + RTL): renderiza hero, 3 tarjetas de valor, flujo de 4 pasos, nota de cumplimiento; CTA "Acceder" visible sin sesión.
- Test de ruta: `/` no exige autenticación.

**Criterios de aceptación:**

- `/` muestra la landing a usuarios anónimos y autenticados.
- El contenido es 100% en español, sin imágenes remotas, navegable por teclado.
- La antigua home ya no es accesible en `/` (ver WP-02 para su nueva ubicación).

---

### WP-02 — Panel técnico actual → sección solo-admin + seguimiento de fases

**Objetivo:** mover el dashboard técnico actual a `/admin/proyecto` visible únicamente para `ADMINISTRADOR`, y actualizar su seguimiento a TODAS las fases desarrolladas (1–7 y 11) más los WP de este plan.

**Estado actual:** `DashboardPage` muestra solo fases 1–3 y estado del backend. Es la home pública actual.

**Diseño técnico:**

- **Solo frontend.**
- Mover `frontend/src/features/dashboard/DashboardPage.tsx` → `frontend/src/features/admin/ProjectPanelPage.tsx` (mismo contenido base: `SystemHealthBadge`, scripts, roadmap).
- **Seguimiento de fases data-driven:** crear `frontend/src/features/admin/projectPhases.ts` con un arreglo curado:
  ```ts
  interface ProjectPhase {
    id: string;            // "F1".."F7", "F11", "WP-01".."WP-08"
    title: string;
    status: "DONE" | "IN_PROGRESS" | "PENDING";
    commit?: string;       // hash corto si aplica
    summary: string;
  }
  ```
  Renderizar la lista completa (F1–F7, F11 = DONE con su commit; WP-01..WP-08 = PENDING hasta entregarse). Mantener actualizado al cerrar cada WP.
- **Guardia:** `<RequireAuth adminOnly>` — extender `RequireAuth` en `App.tsx` con prop opcional `adminOnly?: boolean` que use `hasRole("ADMINISTRADOR")` además del permiso. Alternativa aceptada: exigir permiso `users:read` (solo ADMINISTRADOR lo posee hoy); preferir `hasRole` explícito para intención clara.
- Navbar: enlace "Proyecto" (icono `LayoutDashboard`) visible solo `hasRole("ADMINISTRADOR")` → `/admin/proyecto`.

**Archivos:**

- Mover/renombrar página; actualizar `App.tsx` (ruta `/admin/proyecto` con guardia admin) y `Navbar.tsx`.
- Actualizar referencias de la antigua ruta del dashboard (DashboardPage deja de existir en `/`).

**Pruebas:**

- Test unitario de `projectPhases.ts` (estructura válida: ids únicos, estados válidos).
- Test de guardia: usuario no-admin ve el mensaje de acceso restringido (render de `RequireAuth` con rol AUXILIAR).

**Criterios de aceptación:**

- `/admin/proyecto` accesible solo con rol ADMINISTRADOR; el resto recibe la pantalla de acceso restringido.
- El panel lista F1–F7 y F11 como DONE con su commit y WP-01..WP-08 con su estado real al momento de la entrega.

---

### WP-03 — Gestión de usuarios: editar rol, permisos y estado

**Objetivo:** desde "Usuarios & RBAC" (solo ADMINISTRADOR) permitir modificar rol, permisos individuales (override granular) y estado ACTIVE/INACTIVE de cualquier usuario.

**Estado actual:** `PUT /users/{id}` ya acepta `role`, `status`, `password`, `email`, `full_name` (`backend/app/schemas/user.py:UserUpdate`). El frontend (`UserManagementModal`) es **solo lectura** (lista + auditoría). No existen overrides de permisos por usuario (los permisos derivan 100% del rol en `deps.require_permission`).

**Diseño técnico — backend:**

1. **Migración `wp03_user_permission_overrides.py`** (down_revision: `phase11_experiment`): columna `users.permission_overrides JSON nullable` con forma `{"grant": [...], "revoke": [...]}`.
2. `models/user.py`: agregar la columna.
3. `schemas/user.py`: `UserUpdate.permission_overrides: dict | None`; `UserResponse.permission_overrides: dict | None`.
4. `api/deps.py::require_permission`: tras calcular permisos del rol, aplicar overrides: `perms = (role_perms - revoke) | grant`.
5. `services/user_service.py::update_user`: persistir overrides y registrar auditoría con acción `PERMISSION_CHANGE` cuando cambien rol/permisos/estado (sin datos sensibles).
6. Protección: un admin no puede quitarse a sí mismo el rol ADMINISTRADOR ni desactivarse (ya existe guarda de auto-desactivación; extender a rol).
7. Endpoint adicional de catálogo: `GET /users/meta/permissions` → lista de todos los permisos conocidos (unión de la matriz) para poblar checkboxes del frontend.

**Diseño técnico — frontend:**

- `EditUserModal.tsx` dentro de `features/users/` (nuevo): formulario con nombre, email, `select` de rol (4 roles), toggle de estado, y dos grupos de checkboxes: "Permisos adicionales (grant)" y "Permisos revocados (revoke)" poblados desde `/users/meta/permissions`.
- `UserManagementModal`: botón "Editar" por fila → abre `EditUserModal`; al guardar, refresca lista (TanStack Query invalidate).
- Mostrar badge "Overrides" en usuarios con `permission_overrides` no vacío.

**Archivos:**

- Backend: migración, `models/user.py`, `schemas/user.py`, `api/deps.py`, `services/user_service.py`, `api/v1/endpoints/users.py` (endpoint meta).
- Frontend: `features/users/EditUserModal.tsx`, `components/UserManagementModal.tsx`, `services/api.ts` (`userService.updateUser`, `getPermissionCatalog`), `types/index.ts`.

**Pruebas:**

- Backend: cambio de rol persiste; override grant habilita un permiso y revoke lo quita en endpoint protegido (403/200 según caso); auditoría `PERMISSION_CHANGE` registrada; auto-protección (admin no puede degradarse).
- Frontend: `EditUserModal` — render con datos del usuario, toggle de estado, envío del payload correcto.

**Criterios de aceptación:**

- Un ADMINISTRADOR puede cambiar rol, estado y overrides de permisos; los cambios tienen efecto inmediato en la API (403/200 verificable) y quedan auditados.

---

### WP-04 — Módulo de evaluación de tesis solo para administradores

**Objetivo:** el apartado de evaluación de tesis (`/tesis`, corpus, corridas, stats, export) visible y accesible únicamente para `ADMINISTRADOR`.

**Estado actual:** `roles.py` asigna `experiment:read/execute` a ADMINISTRADOR y ABOGADO_NOTARIO, y `experiment:read` a AUXILIAR y ADMINISTRACION. El navbar y la ruta dependen de esos permisos.

**Diseño técnico:**

- `backend/app/core/roles.py`: eliminar `experiment:read` y `experiment:execute` de `ABOGADO_NOTARIO`, `AUXILIAR` y `ADMINISTRACION` (conservar solo en `ADMINISTRADOR`).
- Sin cambios de UI necesarios (navbar/ruta ya están condicionados por permiso).
- Ajustar pruebas existentes que asumen acceso de otros roles: revisar `tests/integration/test_experiment_api.py` (el caso 403 usa AUXILIAR — sigue válido) y añadir caso explícito: `ABOGADO_NOTARIO` → 403 en `/experiment/cases/generate` y en `/experiment/stats`.
- `README.md` § Fase 11: actualizar la nota de permisos.

**Pruebas:**

- `test_experiment_api.py`: ABOGADO_NOTARIO y ADMINISTRACION reciben 403 en endpoints del experimento; ADMINISTRADOR conserva acceso total.

**Criterios de aceptación:**

- Solo ADMINISTRADOR ve el enlace "Módulo Tesis" y puede llamar a cualquier endpoint `/experiment/*`.

---

### WP-05 — Inventario y verificación de archivos + preview en modal

**Objetivo:** vista operativa de TODOS los archivos gestionados por el sistema con verificación de persistencia (¿existe en disco? ¿tamaño y hash coinciden con la BD?) y **previsualización en modal sin salir de la página ni descargar**.

**Estado actual:** archivos en `backend/uploads/templates/` (versiones de plantilla), `backend/uploads/attachments/` (adjuntos de campos), `backend/generated/documents/` (borradores) y `backend/generated/previews/` (renders de prueba). No existe inventario ni preview in-app (solo descarga).

**Diseño técnico — backend:**

1. **Servicio `services/file_inventory_service.py`:**
   - Recorre las 4 fuentes: `TemplateVersion` (con file_path), `FieldAttachment`, `DocumentVersion`, previews del directorio `generated/previews/` (sin tabla; listar del FS).
   - Por cada registro: `exists_on_disk`, `size_on_disk`, `size_matches_db`, `hash_matches_db` (recalcular SHA-256 solo si el tamaño coincide, para no leer archivos enormes), `path` relativo seguro, `kind` (`TEMPLATE_VERSION | ATTACHMENT | DOCUMENT_VERSION | PREVIEW`), referencia (template/case).
2. **Endpoints** (nuevo router `endpoints/files.py`, prefijo `/files`, permiso `files:read` — agregar a la matriz: ADMINISTRADOR + ABOGADO_NOTARIO):
   - `GET /files/inventory?kind=&status=&skip=&limit=` → lista con verificación.
   - `GET /files/preview/{kind}/{record_id}` → extracción de texto para preview:
     - `.docx` → párrafos y celdas con `python-docx` (límite ~4000 palabras).
     - `.pdf` → texto con `pypdf`; si escaneado → marca `EXTRACCION_NO_DISPONIBLE_SIN_OCR`.
     - `.csv/.xlsx` → primeras 25 filas con pandas.
     - Otros → 415 con mensaje claro.
   - Respuesta: `{ "file_name", "kind", "media_type", "preview_type": "text|table|unavailable", "content": ... , "truncated": bool }`.
3. Sanitización: nunca exponer rutas absolutas al cliente (devolver solo nombre + carpeta lógica: `uploads/templates/`).

**Diseño técnico — frontend:**

- `features/files/FilesPage.tsx` (ruta `/archivos`, permiso `files:read`): tabla con columnas — nombre, tipo, origen (plantilla/expediente), tamaño, estado de persistencia (badge `OK` verde / `NO ENCONTRADO` rojo / `DIFIERE HASH` ámbar), fecha, acción "Ver".
- `features/files/FilePreviewModal.tsx`: abre en modal (sin descarga ni navegación) mostrando texto/tabla con scroll; estado de carga y de error (`EXTRACCION_NO_DISPONIBLE_SIN_OCR` → mensaje informativo).
- Navbar: enlace "Archivos" con `files:read`.

**Pruebas:**

- Backend: inventario lista las 4 fuentes con verificación correcta (crear archivos reales en tmp); archivo borrado → `NO ENCONTRADO`; preview docx devuelve texto; pdf escaneado → marca sin OCR; RBAC (403 para AUXILIAR/ADMINISTRACION).
- Frontend: `FilePreviewModal` renderiza texto recibido y estados de error/vacío.

**Criterios de aceptación:**

- Se listan todos los archivos con su verificación de persistencia correcta y se puede previsualizar su contenido en un modal sin descargarlo ni abandonar la página.

---

### WP-06 — Guía: plantillas vs. borradores vs. expedientes

**Objetivo:** guía clara e in-app que marque la diferencia entre los tres conceptos y el uso de cada uno, con tips contextuales en los módulos.

**Diseño técnico (solo frontend):**

- `features/guide/GuidePage.tsx` (ruta `/guia`, visible para todo usuario autenticado y enlazada desde landing y navbar):
  - **Expediente:** el caso legal (carpeta). Contiene comparecientes, datos, documentos y borradores. Ejemplo: EXP-2026-00001.
  - **Plantilla:** el molde DOCX reutilizable con variables Jinja2; pertenece a un tipo de escritura; versionamiento inmutable; una sola versión ACTIVA.
  - **Borrador:** el documento DOCX generado al combinar plantilla + datos del expediente; versionado, verificado, descargable.
  - Diagrama del flujo: `Expediente (datos) + Plantilla (molde) → Validación → Borrador`.
  - Tabla comparativa: ¿qué se edita? ¿dónde vive? ¿quién lo crea? ¿se puede borrar?
  - Tips prácticos (5–8 bullets: cuándo crear nueva versión de plantilla vs. nuevo borrador, por qué validar antes de generar, etc.).
- `components/common/ModuleTip.tsx`: pequeño "?" con popover que enlaza a la sección ancla de `/guia`; insertarlo en `TemplatesPage`, `DocumentsPage` y `CasesPage` (texto de ayuda de 1 línea por módulo).

**Pruebas:**

- `GuidePage.test.tsx`: renderiza las tres definiciones, la tabla comparativa y los tips; `ModuleTip` renderiza el popover con el enlace correcto.

**Criterios de aceptación:**

- `/guia` accesible para cualquier rol autenticado; cada módulo citado muestra su tip contextual que enlaza a la sección correspondiente.

---

### WP-07 — Editor de borradores: formulario a la izquierda + preview en vivo a la derecha (incisos editables)

**Objetivo:** página de captura de datos de borrador en dos paneles: **izquierda** el formulario de campos; **derecha** previsualización del documento que se actualiza al escribir; los incisos (cláusulas) son editables: agregar, eliminar, reordenar y renumerar.

**Estado actual:** captura en `/formularios` (DynamicForm sin preview). La generación DOCX ya existe (Fase 7). Los campos tipo `list` (p. ej. `clausulas`) ya se persisten en `CaseFieldValues`.

**Diseño técnico — backend:**

1. **Endpoint de preview textual** en `endpoints/documents.py` (permiso `documents:read`):
   - `POST /documents/preview-render { case_id, template_version_id, values }` → renderiza con `DocxTemplate` + `ChainableUndefined` en memoria (sin persistir), extrae texto con `python-docx` y devuelve:
     ```json
     {
       "html": "<p>ESCRITURA No. 151</p><p>COMPARECE: Ana…</p>",
       "placeholders_free": true,
       "residual_variables": []
     }
     ```
   - Reutilizar `build_render_context` (Fase 7) y `find_residual_variables` (Fase 5). Escapar HTML del texto (XSS) y envolver párrafos en `<p>`; tablas en `<table>` básica.
2. Sin persistencia nueva: los valores se guardan con el `PUT /fields/cases/{id}/versions/{vid}` existente; la generación final usa `POST /documents/generate` existente.

**Diseño técnico — frontend:**

- Nueva página `features/editor/DraftEditorPage.tsx` (ruta `/editor?expediente=&version=`, permiso `cases:update`):
  - **Panel izquierdo (~40%):** formulario de campos de la versión (reusar controles de `features/fields/FieldControls.tsx` / patrón de `DynamicForm` en modo embebido o instancia de `DynamicForm` si es reusable tal cual — evaluar primero la reutilización directa antes de duplicar controles).
  - **Panel derecho (~60%):** `LivePreview` — llama a `preview-render` con **debounce de 800 ms** tras cada cambio (TanStack Query `enabled` por hash de valores) y pinta el HTML sanitizado (el backend ya escapa; frontend NO usa `dangerouslySetInnerHTML` sin sanitizer — usar el HTML ya escapado del backend y revisar contra lista blanca simple en cliente).
  - **Incisos editables:** el campo `clausulas` (tipo list) se edita con: botón "Añadir inciso" (inserta ítem con `numero` auto = max+1), eliminar, subir/bajar (renumera `numero` en orden), y edición del texto del inciso; cada operación refresca el preview.
  - Acciones superiores: Guardar (`PUT fields`), Validar (abre `CaseValidationModal` con los valores actuales — usar `values` override), Generar DOCX (`GenerateDocumentModal`).
  - Estados: sin expediente/versión seleccionados → selectores iniciales (como `FieldsPage`).
- Extracción de lógica a `features/editor/useDraftEditor.ts` (estado de valores, debounce, operaciones de incisos) para testabilidad.

**Archivos:**

- Backend: `endpoints/documents.py` (endpoint), `services/document_generation_service.py` (función `render_preview_html`).
- Frontend: `features/editor/{DraftEditorPage,LivePreview,useDraftEditor}.tsx/ts`, enlace "Editor" en `CaseDetailModal` y en navbar (`cases:update`).
- Revisar `features/fields/FieldControls.tsx` para reutilizar controles (NO duplicar si son importables).

**Pruebas:**

- Backend: `preview-render` devuelve HTML con valores sustituidos, escapa HTML inyectado en un campo de texto (XSS), marca placeholders residuales; RBAC.
- Frontend: `useDraftEditor` — añadir inciso numera max+1, reordenar renumera, eliminar renumera sin huecos; debounce no dispara más de una llamada por ráfaga (fake timers).

**Criterios de aceptación:**

- Escribir en cualquier campo actualiza el preview en <1 s; los incisos pueden añadirse/eliminarse/reordenarse con renumeración automática; guardar persiste; generar produce el DOCX verificado con los mismos datos del preview.

---

### WP-08 — Atajos de teclado en el editor de borradores

**Objetivo:** agilizar el llenado con teclado y dejar los atajos visibles en pequeños hints (kbd) junto a los controles.

**Diseño técnico:**

- Hook `features/editor/useEditorShortcuts.ts`:
  - **Tab / Shift+Tab:** navegación natural por orden de campos (asegurar `tabIndex` correcto y orden DOM; saltar botones destructivos con `tabIndex={-1}` salvo intención explícita).
  - **Ctrl+S:** guardar valores. **Ctrl+Enter:** ejecutar validación. **Ctrl+G:** generar DOCX.
  - **Alt+N:** añadir inciso. **Alt+↑ / Alt+↓:** mover inciso enfocado. **Supr:** eliminar inciso enfocado (con confirmación ligera o Undo toast de 5 s).
  - Los atajos solo activos dentro de la página del editor (registrar/limpiar listeners en mount/unmount; ignorar cuando el foco está en textarea para Ctrl+Enter/Supr según convenga).
- `components/common/ShortcutHint.tsx`: chip `<kbd>` con estilo kbd (slate oscuro) + texto; colocar hints junto a los botones ("Guardar Ctrl+S", "Añadir inciso Alt+N") y un bloque de ayuda compacto arriba del panel derecho.
- Accesibilidad: `aria-keyshortcuts` en los botones correspondientes.

**Pruebas:**

- Hook: mapeo tecla→acción (función pura `resolveShortcut(event)`) con casos Tab/Shift+Tab/Ctrl+S/Alt+N/Supr; no interfiere con inputs cuando el modificador no aplica.
- Render de `ShortcutHint`.

**Criterios de aceptación:**

- Todos los atajos listados funcionan en el editor y sus hints son visibles junto a las acciones; Tab y Shift+Tab recorren los campos en orden lógico completo.

---

## 4. Resumen de cambios de matriz RBAC

| Permiso | Roles finales tras el plan |
|---|---|
| `experiment:read/execute` | **solo ADMINISTRADOR** (WP-04) |
| `files:read` (nuevo, WP-05) | ADMINISTRADOR + ABOGADO_NOTARIO |
| Overrides por usuario (WP-03) | ADMINISTRADOR gestiona `grant`/`revoke` por usuario |

---

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Preview en vivo con coste de render por tecla | Debounce 800 ms + caché por hash de valores; render textual (no imagen) |
| XSS en preview (texto del usuario → HTML) | Escapado en backend + verificación en pruebas con payload malicioso |
| Overrides de permisos rompen invariantes del RBAC | Auditoría `PERMISSION_CHANGE` + auto-protección del admin + pruebas 403/200 |
| Duplicación de controles del DynamicForm en el editor | Evaluar reutilización de `FieldControls` antes de crear controles nuevos (regla del proyecto: no duplicar formularios) |
| Recalcular SHA-256 de archivos grandes en inventario | Solo recalcular si el tamaño coincide con la BD; límite 10 MB por diseño |

---

## 6. Verificación global al finalizar (obligatoria)

1. `.\scripts\test.ps1` → exit 0 (ruff + pytest + vitest + build).
2. Recorrido manual: landing → login admin → `/admin/proyecto` → editar usuario (rol/permiso/estado) → `/guia` → `/archivos` con preview en modal → editor de borrador con preview en vivo e incisos → atajos de teclado → `/tesis` visible solo como admin.
3. `README.md` con roadmap actualizado + commits por WP (feature + docs).

---

> **Fin del plan.** Cualquier agente puede tomar un WP, implementarlo con las
> reglas de la §0 y marcar su cierre en el roadmap del `README.md`.
