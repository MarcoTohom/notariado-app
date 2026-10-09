# Fase estructural 4: componentes y controles compartidos

Fecha: **2026-10-08**. Referencia anterior: commit `da9d93b`. [Índice](../README.md) · [Plan y estado](../PLAN_MEJORA_ESTRUCTURAL.md) · [Mapa actualizado](../modules.md).

## Entrega

[Modal](../../frontend/src/components/common/Modal.tsx) reúne contenedor y cabecera de once modales. Mantiene cinco tamaños, altura de 90/85 vh o contenido, animación del acceso y la presentación de cada título. ModalFrame también compone ConfirmDialog, conservando su capa y apariencia. ModalBody reúne cuerpos desplazables y ModalActions las acciones repetidas de cuatro formularios; los formularios siguen dentro de cada funcionalidad.

[Feedback](../../frontend/src/components/common/Feedback.tsx) reúne errores de campo, errores de servidor y estados de carga. [Badge](../../frontend/src/components/common/Badge.tsx) concentra la estructura repetida de indicadores y recibe los colores de cada consumidor. [formStyles](../../frontend/src/components/common/formStyles.ts) conserva estilos de los formularios estáticos y dinámicos. Las consultas, permisos, datos y acciones permanecen en sus funcionalidades.

[FieldControls](../../frontend/src/features/fields/FieldControls.tsx) pasó de **600 a 121 líneas** y conserva registro de veinte tipos y composición con React Hook Form. [controls](../../frontend/src/features/fields/controls) reúne entradas básicas, texto, selección, relaciones, archivos y listas, sus props y el contexto de actividad de adjuntos. ListInput recibe el renderizador por prop para conservar la recursión sin un import circular.

[FieldDefinitionEditor](../../frontend/src/features/fields/FieldDefinitionEditor.tsx) pasó de **553 a 94 líneas** y conserva orden, expansión y edición anidada. [editor](../../frontend/src/features/fields/editor) contiene configuración, opciones por tipo, restricciones, defaults y controles auxiliares. Cada sección recibe un callback de cambios parciales; los merges de opciones se conservan. Las cantidades de líneas incluyen el salto final.

Los diálogos tienen nombres asociados a sus títulos y sus botones de cierre tienen nombre accesible y `type="button"`. Errores y carga exponen roles alert/status. Las condiciones de apertura, cierre y envío siguen en cada pantalla.

## Equivalencia comprobada

La comparación AST con `da9d93b` comprobó **23 cuerpos** de controles/helpers, registro, props y contexto de adjuntos; **tres acciones** del editor y sus **tres secciones** equivalentes después de adaptar callbacks. Conserva normalización, restricciones, opciones, relaciones, listas, upload/download y cálculo. Comprueba **12 bloques de preparación/manejadores** de modales y validación de archivo; títulos, subtítulos, iconos, tamaños, alturas y animación conservados.

Se verificaron **36 archivos** de contratos e infraestructura sin cambios, los **11 archivos de pruebas frontend previas** y el E2E anterior intactos. **295 imports relativos** comprobados, sin destinos rotos ni ciclos. Backend, configuración, dependencias y scripts operativos sin cambios. [Evidencia](phase4/structure-verification.json) · [Verificador reproducible](phase4/verify-structure.cjs).

## Pruebas ejecutadas

| Comando desde frontend | Resultado |
|---|---|
| `npm.cmd run lint` | Aprobado, sin advertencias ESLint |
| `npm.cmd test` | **111 pruebas**, 13 archivos, aprobadas en 23.59 s |
| `npm.cmd run build` | TypeScript y Vite aprobados; 1836 módulos transformados |
| `npm.cmd run test:e2e` | **Dos escenarios Chromium aprobados**, ejecución total 39.2 s |

Se mantienen los 102 escenarios anteriores y se añaden **nueve** para riesgos de esta extracción. Cuatro comprueban cierre con teclado sin envío accidental, dimensiones/etiquetas de diálogos simultáneos, confirmación/cancelación y mensajes accesibles. Cinco comprueban merges de catálogos, restricciones monetarias de texto, cambios de tipo/fuente, edición anidada, orden y claves nuevas.

El E2E existente conserva captura de veinte tipos, autocompletado, listas, cálculo, adjuntos, guardado y recuperación. El nuevo comprueba acceso/cierre con teclado, validación y alta/edición de cliente con DPI inmutable, cancelación de confirmación, alta de persona jurídica, alta/detalle de expediente, apertura de validación/generación, rechazo de archivo incorrecto y lista de usuarios. Su primera ejecución se detuvo por una expectativa de texto del test (`Activo` frente a `ACTIVO`); se corrigió la expectativa conservando el texto de la pantalla y ambos escenarios pasaron.

Chromium usó la ruta de `scripts/common.ps1`, backend 8011, frontend 5174 y SQLite/almacenamiento temporales. Se restauraron TEMP, TMP, PLAYWRIGHT_BROWSERS_PATH y carpeta de trabajo. Únicamente se usaron datos sintéticos. Para repetir toda la verificación del proyecto desde la raíz: `scripts/test.ps1 -E2E`.

[Resultados](phase4/verification-results.json) · [Comprobación documental](phase4/documentation-verification.json) · [Verificador documental](phase4/verify-documentation.py). Desde la raíz, los verificadores se ejecutan con `node docs/testing/phase4/verify-structure.cjs` y `backend/.venv/Scripts/python.exe docs/testing/phase4/verify-documentation.py`.

## Límites y siguiente entrega

La suite backend de 260 escenarios permanece como evidencia de fase 1 y no se repitió en esta entrega: backend, esquema y operación se conservaron. La prueba de apertura de generación no acredita el recorrido completo hasta un DOCX; la verificación integral corresponde a fase 7. El teclado se comprueba en las acciones indicadas; no constituye una auditoría completa de accesibilidad.

Vite conserva avisos preexistentes de comentarios de Zod y tamaño de bundle. El JavaScript de producción fue 593.65 kB, gzip 171.87 kB. No se deduce una mejora de rendimiento ni reducción de tiempos de revisión a partir de estos resultados.

La siguiente entrega es la **fase estructural 5: responsabilidades y dependencias del backend**. Los cambios de fase 4 quedan preparados para su siguiente commit.
