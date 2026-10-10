# Referencia inicial de la mejora estructural

Fecha: 8 de octubre de 2026. Fase estructural 0 completada.

Se preparó y verificó el entorno local antes de reorganizar módulos. Se conservaron los cambios previos de documentación, los manifiestos de dependencias y las migraciones. Las comprobaciones utilizaron datos sintéticos, bases SQLite temporales y almacenamiento aislado.

## Entorno verificado

| Herramienta | Versión / ubicación |
|---|---|
| Sistema | Windows 11, compilación 26200 |
| Python | 3.12.14; entorno `backend/.venv` |
| Node.js | 24.19.0 |
| npm | 11.17.0 |
| React / TypeScript / Vite | 18.3.1 / 5.9.3 / 5.4.21 |
| Playwright / Chromium | 1.63.0 / 153.0.8010.12 |
| FastAPI / SQLAlchemy / Pydantic | 0.143.0 / 2.1.4 / 2.14.0 |
| Alembic / pytest / Ruff | 1.20.0 / 9.1.1 / 0.16.10 |
| docxtpl / python-docx | 0.20.2 / 1.2.0 |

El comando `python` del PATH apuntaba al alias de WindowsApps y `py` no estaba disponible. Se creó el entorno con Python 3.12.14 del runtime local de Codex. El intento anterior con Python 3.13 de Laragon no completó `ensurepip`. La instalación del entorno definitivo utilizó una carpeta temporal dentro de `.venv` para evitar restricciones de acceso.

Se instalaron las dependencias Python mediante `backend/requirements.txt` y las del frontend mediante `npm ci`. No se modificó `frontend/package-lock.json`. `pip check` confirmó que no había requisitos incompatibles. Las versiones exactas resueltas están en [environment.json](baseline/2026-10-08/environment.json) y [frontend-packages.json](baseline/2026-10-08/frontend-packages.json). El listado Python es una referencia; el archivo instalable de versiones se preparará en la fase 1.

## Referencias conservadas

Commit de partida: `e03cde0d417e56d5a12d3b13e2308b4d6d136772`.

| Referencia | Resultado | Archivo |
|---|---|---|
| Contrato OpenAPI | 47 rutas, 62 operaciones y 67 esquemas | [openapi.json](baseline/2026-10-08/openapi.json) |
| Esquema SQLite migrado | 17 tablas de dominio y `alembic_version` | [database-schema.json](baseline/2026-10-08/database-schema.json) |
| Revisión Alembic | `phase11_experiment` | [database-schema.json](baseline/2026-10-08/database-schema.json) |
| Permisos | Matriz de los cuatro roles | [permissions.json](baseline/2026-10-08/permissions.json) |
| Motor de consistencia | Catálogo de veinte reglas | [rule-catalog.json](baseline/2026-10-08/rule-catalog.json) |
| Escenarios backend | 177 unitarios y 77 de integración | [backend-tests.json](baseline/2026-10-08/backend-tests.json) |
| Código y dependencias internas | 157 archivos con SHA-256 e imports backend `from app...` | [source-inventory.json](baseline/2026-10-08/source-inventory.json) |

La captura se realizó antes de los dos ajustes descritos abajo. Sus hashes originales se conservan; [verification-changes.json](baseline/2026-10-08/verification-changes.json) identifica los archivos modificados y sus hashes al cierre. No hay cambios en código backend, contratos, permisos, reglas, migraciones ni manifiestos. El mapa de imports identifica dependencias explícitas del backend; no representa imports dinámicos ni un análisis completo de ciclos del frontend.

La herramienta [scripts/baseline.ps1](../../scripts/baseline.ps1), apoyada por [capture_baseline.py](../../scripts/capture_baseline.py), aplica las migraciones en una base temporal, recoge escenarios sin ejecutar pruebas y exporta metadatos técnicos. Rechaza carpetas de salida fuera del proyecto y referencias que ya contengan archivos, para conservar el historial. No exporta filas de clientes, credenciales ni configuración local.

## Resultados de verificación

| Comprobación | Resultado |
|---|---|
| Ruff backend: lint y formato | Aprobados; 98 archivos de aplicación y pruebas |
| pytest | 254 aprobadas; 58,49 segundos |
| ESLint | Aprobado |
| Vitest | 85 aprobadas en ocho archivos; 36,35 segundos |
| TypeScript y compilación Vite | Aprobados; 1.805 módulos |
| Playwright | Un escenario aprobado; 16,8 segundos incluyendo servidores |
| Migraciones SQLite | Cadena completa aplicada sobre base nueva temporal |
| Consistencia de dependencias Python | `pip check` aprobado |

La ejecución de `scripts/test.ps1 -E2E` aprobó Ruff, pytest, ESLint, Vitest y compilación, pero falló al llegar a un selector de navegador. Tras corregir ese selector, el recorrido detectó el desbordamiento móvil. Se repitieron ESLint, compilación y E2E después del ajuste de la cabecera; los tres terminaron con código 0. No se repitió la suite backend, cuyo código permaneció intacto. [verification-results.json](baseline/2026-10-08/verification-results.json) registra estos resultados y sus límites.

Los primeros intentos dentro del sandbox tuvieron restricciones de acceso: pytest quedó bloqueado en la primera prueba y Vitest/Vite reportaron `EPERM` al resolver archivos. Una ejecución autorizada de la prueba afectada y después de la suite completa permitió distinguir estos problemas del entorno de los fallos reales del navegador. Los resultados aprobados corresponden a esas ejecuciones autorizadas.

## Ajustes necesarios para verificar el recorrido

1. **Selectores E2E:** los campos obligatorios tienen los nombres accesibles `precio *` y `descripcion *`. La prueba buscaba nombres sin el asterisco con coincidencia exacta. Se actualizaron los selectores y se añadió la comprobación de `aria-required`. Se conservaron las aserciones de cálculo, persistencia, reordenamiento, saneamiento, descarga y ancho móvil.
2. **Cabecera adaptable:** a 390 píxeles de ancho, la cabecera producía una página de 407 píxeles y cortaba el botón de cierre de sesión. Se permitió distribuir sus elementos y enlaces en varias filas, manteniendo los controles y permisos existentes. El recorrido final aprobó la aserción de ausencia de desplazamiento horizontal. Se revisaron visualmente las capturas de escritorio y móvil.

Estos ajustes están delimitados a verificación y distribución visual. No cambian cálculos, validaciones notariales ni persistencia. La cabecera puede ocupar más de una fila también en escritorio cuando sus elementos exceden el espacio disponible.

## Comandos de reproducción

Los comandos de este apartado describen el procedimiento de la fase 0. Después de la fase 1, utilizar la [guía de instalación vigente](../installation.md): las dependencias de desarrollo tienen un registro separado y Chromium se conserva en `frontend/.cache/ms-playwright`.

Desde la raíz del proyecto, con el entorno ya instalado:

```powershell
$env:TEMP = Join-Path (Get-Location) 'backend\.venv\temp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'frontend\node_modules\.cache\ms-playwright'
.\backend\.venv\Scripts\python.exe -m pip check
.\scripts\test.ps1 -E2E
```

Para una nueva referencia, elegir una carpeta vacía distinta de la referencia inicial:

```powershell
.\scripts\baseline.ps1 -OutputDirectory 'docs/testing/baseline/comparacion-fase-1'
```

Para instalar las dependencias y Chromium, se utilizaron estos comandos en sus carpetas correspondientes:

```powershell
# Desde backend, con .venv ya creado:
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Desde frontend:
npm.cmd ci --no-audit --no-fund
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'node_modules\.cache\ms-playwright'
.\node_modules\.bin\playwright.cmd install chromium
```

La instalación descarga paquetes y Chromium una vez; las verificaciones y servidores posteriores funcionan localmente. Las restricciones de ejecución del agente pueden requerir ejecución autorizada, como ocurrió en esta sesión. Estos comandos reproducen las herramientas usadas; `setup.ps1` y la instalación centralizada corresponden a la fase siguiente.

## Cobertura y pendientes

- El E2E existente cubre autenticación, formulario y versión, veinte tipos de campo, autocompletado de cliente, valores monetarios, listas, adjuntos, guardado, recarga y descarga de un CSV sintético. El cliente y expediente se crean por API. No cubre todo el recorrido por las pantallas ni la descarga de un borrador DOCX.
- Las pruebas de integración backend aprobadas cubren generación DOCX verificada, bloqueo por hallazgos críticos, descarga autenticada y versiones acumuladas. También cubren el corpus de 100 casos sintéticos y exportaciones XLSX/CSV. Esto no demuestra la reducción experimental de tiempos.
- No se calcularon porcentajes de cobertura, ni se realizó una auditoría de lógica o seguridad, ni una revisión exhaustiva de todas las pantallas. Las comprobaciones actuales fijan una referencia para comparar las reorganizaciones.
- Se registraron advertencias de Starlette sobre su integración con httpx, anotaciones de Zod que Rollup elimina y un archivo JavaScript de 602,34 kB —171,83 kB comprimido— que supera el umbral de 500 kB. npm avisó del postinstall de esbuild sin aprobación y Playwright de variables de color incompatibles. La compilación y las pruebas finalizaron; no se cambiaron dependencias ni se ocultaron advertencias.

La siguiente entrega es la fase 1: unificar instalación y configuración, conservar versiones instalables, archivar los generadores antiguos y ordenar las exclusiones del repositorio. El seguimiento está en el [plan de mejora estructural](../PLAN_MEJORA_ESTRUCTURAL.md).
