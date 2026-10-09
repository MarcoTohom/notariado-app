# Fase estructural 7: verificación integral y cierre

Fecha: 8 de octubre de 2026. Las fases estructurales **0–7 están completadas**. Las fases funcionales pendientes del plan académico conservan su estado propio.

## Resultado y evidencia

| Comprobación | Resultado |
|---|---|
| Ruff: lint y formato | Aprobados, 119 archivos backend |
| Pytest | 260 escenarios aprobados; 151 funciones y sus aserciones conservadas |
| ESLint y Vitest | Aprobados; 111 pruebas en 13 archivos |
| TypeScript y Vite | Compilación aprobada |
| Playwright Chromium | Tres escenarios aprobados: campos, modales y DOCX |
| API y persistencia | OpenAPI idéntico: 47 rutas/62 operaciones; 18 tablas, índices y relaciones idénticos |
| Motor de reglas | Catálogo, permisos y orden conservados; 100 casos persistidos producen exactamente los hallazgos esperados |
| Corpus y exportaciones | 20 casos por tipo, 50 íntegros/50 con anomalías; XLSX y CSV verificados sin crear mediciones |
| Windows PowerShell 5.1 | Preparación repetida, seed, arranque/proxy y dos respaldos aprobados con datos temporales |

[Resultados de suite](phase7/verification-results.json), [operación](phase7/operations-verification.json), [corpus/exportación](phase7/experiment-verification.json), [equivalencia backend](phase5/structure-verification.json), [inventario de escenarios](phase6/test-inventory.json) y [verificación documental](phase7/documentation-verification.json).

## Recorrido DOCX e historial

[documents.spec.ts](../../frontend/e2e/documents.spec.ts) inicia sesión en navegador, carga una plantilla sintética, detecta variables, activa la versión, prueba el render, captura y guarda los datos desde Formularios y ejecuta validación desde Expedientes. Genera dos borradores desde el modal y consulta su historial. Descarga ambos mediante la API autenticada y los inspecciona con **python-docx**: sin marcadores residuales, DPI con ceros iniciales conservado y contenido correspondiente a cada versión. Vuelve a descargar la primera versión tras generar la segunda y comprueba que conserva contenido y hash registrados.

La preparación del cliente y expediente con compareciente utiliza la API real; sus formularios de interfaz están cubiertos por los otros E2E. No se simulan respuestas del backend. Se mantienen las pruebas de bloqueo por hallazgos críticos, RBAC, adjuntos, versiones inmutables y exportaciones.

## Operación y ajuste delimitado

[verify-operations.ps1](phase7/verify-operations.ps1) configura SQLite, uploads y generated temporales antes de ejecutar scripts. La preparación repetida conserva los hashes de configuración, lock, base y documentos. Dos copias distintas conservan el corpus y archivos, con `PRAGMA integrity_check = ok`. Los procesos de comprobación se cierran.

Se corrigió una comprobación de disponibilidad: `dev.ps1 -Check` consultaba el proxy una sola vez con cinco segundos de espera, lo que agotó el tiempo en dos arranques aislados. Ahora reutiliza la espera existente, con reintentos acotados a 30 segundos y detección de procesos terminados. El arranque/proxy aprobó después del ajuste. No se modifican rutas ni respuestas.

La instalación inicial limpia se verificó en fase 1; el cierre repite la preparación sobre dependencias fijadas y datos temporales existentes. Las comprobaciones locales no requieren servicios cloud. No se sobrescribieron configuración, documentos ni respaldos del usuario.

## Límites y hallazgos fuera del alcance estructural

- La descarga DOCX se comprobó con Bearer mediante la API. Los enlaces directos `<a href>` de borradores y render de prueba conservan el comportamiento previo; no incorporan el token que el cliente Axios añade a sus peticiones. Esa integración de descarga desde el enlace requiere una corrección funcional y no se declara aprobada por este E2E.
- Sin ejecuciones experimentales, XLSX conserva el resumen sin reducción calculada y CSV está vacío. El cierre dejó **cero ejecuciones y cero mediciones** en la base del corpus; no demuestra la meta 240 → 60 minutos. Las pruebas automatizadas del cronómetro verifican cálculos con datos controlados y no son resultados de investigación.
- Persisten los avisos previos de Starlette/httpx, anotaciones de Zod y tamaño del bundle Vite. `npm ci` informa que el postinstall de esbuild no tiene una entrada en `allowScripts`; la compilación y los E2E funcionan con las dependencias instaladas. No se cambiaron versiones ni políticas de instalación para silenciarlos.
- Ingesta XLSX/CSV/PDF y finanzas siguen previstas en el plan funcional. La reorganización no implementa esos módulos, OCR ni IA externa, y no sustituye la revisión notarial.

## Reproducción

Desde la raíz, con el entorno preparado:

```powershell
.\scripts\test.ps1 -E2E
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/testing/phase7/verify-operations.ps1
.\backend\.venv\Scripts\python.exe docs/testing/phase5/verify-structure.py
.\backend\.venv\Scripts\python.exe docs/testing/phase6/verify-tests.py
.\backend\.venv\Scripts\python.exe docs/testing/phase7/verify-documentation.py
```

Los verificadores de extracción comparan con commits fijos; los informes anteriores son evidencia histórica de sus fases. Los resultados finales y tiempos de software están en los JSON enlazados.
