# Plan de mejora estructural

Fecha: 8 de octubre de 2026.

Objetivo: facilitar la instalación, navegación, mantenimiento y revisión del proyecto mediante una reorganización gradual de archivos y responsabilidades, conservando el comportamiento existente.

Este plan complementa el [plan maestro funcional](MASTER_PLAN.md). Sus fases estructurales 0–7 tienen seguimiento propio y no cambian la numeración de las once fases de desarrollo de la tesis.

## Alcance y condiciones de trabajo

- Mantener el monolito modular local: React, FastAPI y SQLite en Windows 10/11.
- Conservar métodos, rutas, permisos, cuerpos de petición y respuestas de la API, así como las rutas de navegación y el funcionamiento de los formularios.
- Conservar tablas, columnas, relaciones y revisiones Alembic existentes. Mover un modelo Python no implica crear una migración ni modificar la base de datos.
- Conservar las veinte reglas, sus severidades, resultados y orden de ejecución; la generación y verificación DOCX; y el historial de versiones.
- Mantener DPI y NIT como texto y los cálculos monetarios con Decimal.
- Usar datos sintéticos y almacenamiento temporal en las verificaciones. Conservar los archivos locales y el trabajo previo del usuario.
- Conservar el protocolo experimental. La reducción de 240 a 60 minutos sigue siendo una meta que requiere mediciones.
- Registrar por separado los hallazgos que exijan cambiar lógica, seguridad, diseño visual o el protocolo de investigación. Este plan no incorpora los módulos funcionales de importación y finanzas.

La revisión inicial fue de código y documentación: esta copia no tenía `backend/.venv` ni `frontend/node_modules`. La fase 0 preparó el entorno y registró las verificaciones, referencias y ajustes delimitados en el [informe inicial](testing/BASELINE_ESTRUCTURAL.md). La existencia de pruebas no equivale a un resultado aprobado; los resultados de cada entrega se registran por separado.

## Secuencia y seguimiento

| Fase estructural | Propósito | Depende de | Estado |
|---|---|---|---|
| 0 | Preparar el entorno y registrar la referencia inicial | — | Completada |
| 1 | Unificar instalación, configuración y limpieza del repositorio | 0 | Completada |
| 2 | Establecer documentación y convenciones de organización | 1 | Completada |
| 3 | Organizar API, tipos y composición del frontend | 2 | Completada |
| 4 | Extraer componentes y controles compartidos | 3 | Pendiente |
| 5 | Separar responsabilidades y dependencias del backend | 4 | Pendiente |
| 6 | Organizar recursos compartidos de pruebas | 5 | Pendiente |
| 7 | Verificar el conjunto y cerrar la documentación | 6 | Pendiente |

Trabajar con cambios pequeños por módulo. Cada entrega debe dejar el proyecto coherente, con sus imports actualizados y sus comprobaciones registradas. No avanzar con una regresión nueva sin resolver.

## Fase 0. Entorno y referencia inicial

**Objetivo:** disponer de evidencia del estado previo a la reorganización.

Tareas:

1. Revisar el estado de Git e identificar cambios existentes que deban conservarse.
2. Registrar las versiones disponibles de Python, Node.js y npm; preparar el entorno virtual y las dependencias del frontend mediante el procedimiento actual.
3. Registrar las versiones Python resueltas y conservar el `package-lock.json` existente. Evitar actualizaciones generales de paquetes como parte de la reorganización.
4. Ejecutar `scripts/test.ps1` y el flujo de navegador con `scripts/test.ps1 -E2E`, una vez instalado Chromium para Playwright.
5. Comprobar migraciones sobre SQLite temporal y revisar la cobertura existente del recorrido cliente → expediente → formulario → validación → borrador → descarga.
6. Registrar las rutas y esquemas públicos de la API, los escenarios de prueba recogidos y el mapa actual de módulos y dependencias compartidas.

**Entregable:** informe inicial con comandos, versiones, resultados y limitaciones reproducibles. El informe debe contener únicamente información técnica y datos sintéticos.

**Cierre:** entorno utilizable y resultados iniciales registrados. Si hay fallos preexistentes, identificar si impiden verificar una reorganización; no convertirlos silenciosamente en trabajo funcional. Documentar las limitaciones del entorno sin marcar comprobaciones pendientes como aprobadas.

## Fase 1. Instalación, configuración y repositorio

**Objetivo:** establecer un único procedimiento vigente para preparar y operar el proyecto.

Tareas:

1. Añadir `scripts/setup.ps1` con resolución de rutas desde la raíz del proyecto, comprobación de requisitos y preparación de dependencias. Debe poder repetirse sin sobrescribir configuración local ni datos.
2. Centralizar la configuración de herramientas Python en `backend/pyproject.toml`, separar dependencias de ejecución y desarrollo, y conservar un registro instalable de versiones verificadas, incluidas las dependencias transitivas.
3. Alinear `.env.example`, configuración y documentación con los nombres de variables realmente utilizados. Documentar desde qué ubicación se resuelven las rutas locales y dónde configura Vite sus variables.
4. Archivar como antecedentes `backend/setup_backend.py` y `backend/setup_tests.py`, que contienen copias antiguas del código y rutas de otra instalación. Dejarlos fuera del procedimiento operativo y preservar su historial.
5. Excluir expresamente respaldos y resultados de ejecución en `.gitignore`. Retirar del seguimiento los artefactos operativos que corresponda, conservando los archivos físicos y los marcadores de directorios necesarios.
6. Revisar que `dev.ps1`, `test.ps1`, `seed.ps1`, `backup.ps1` y `experiment.ps1` utilicen convenciones consistentes de rutas y comuniquen los fallos de ejecución.

**Entregable:** configuración centralizada, instalación documentada y scripts operativos claramente identificados.

**Cierre:** preparar y arrancar el proyecto desde su ubicación real; repetir la preparación sin perder datos; mantener operativo el comando de pruebas. Cualquier ajuste al procedimiento de respaldo debe comprobarse con archivos sintéticos, sin alterar respaldos existentes.

## Fase 2. Documentación y convenciones

**Objetivo:** hacer que un nuevo colaborador pueda localizar código, instalar el sistema y distinguir lo implementado de lo previsto.

Tareas:

1. Crear un índice documental en `docs/README.md`, con apartados técnicos, de uso y académicos.
2. Corregir enlaces a otras computadoras y referencias antiguas a scripts, endpoints y carpetas, contrastándolos con el código actual.
3. Actualizar instalación, arquitectura y mapa de módulos. Conservar la documentación académica y el historial de desarrollo; presentar con claridad las funcionalidades previstas y las verificadas.
4. Documentar convenciones breves: nombres de archivos, ubicación de tipos y llamadas HTTP, componentes compartidos, imports públicos y recursos de pruebas.
5. Registrar la decisión de mantener el backend por capas y completar la organización del frontend por funcionalidades. No crear carpetas sin una responsabilidad concreta.

**Entregable:** índice, guías actualizadas y convenciones de contribución, incluyendo enlaces a este plan.

**Cierre:** enlaces internos válidos y procedimiento de instalación ejecutable. Cada fase posterior actualizará el mapa documental al modificar la estructura.

## Fase 3. API, tipos y composición del frontend

**Objetivo:** concentrar los archivos de cada funcionalidad en su módulo.

Tareas:

1. Separar el cliente HTTP y el manejo común de errores de los servicios de cada módulo.
2. Distribuir las llamadas de `src/services/api.ts` y los tipos de `src/types/index.ts` entre clientes, expedientes, plantillas, documentos, validación, experimento, autenticación y usuarios, según su responsabilidad.
3. Mantener en una ubicación común únicamente los contratos compartidos por varios módulos. Usar `features/fields/api.ts` y `types.ts` como referencia existente.
4. Separar la composición de proveedores, rutas y layout de `App.tsx` cuando facilite su lectura. Conservar navegación y controles de acceso actuales.
5. Actualizar imports de forma gradual. Los reexports de compatibilidad serán temporales y se retirarán cuando no tengan consumidores; evitar ciclos entre módulos.

Estructura orientativa para un módulo de mayor tamaño:

```text
features/clients/
├── api.ts
├── types.ts
├── hooks/
├── components/
├── pages/
└── __tests__/
```

Las subdivisiones se crean según el contenido real. No todos los módulos requieren `hooks/`, `pages/` y `components/`.

**Entregable:** API y tipos distribuidos por funcionalidad; archivos centrales limitados a responsabilidades compartidas.

**Cierre:** lint, pruebas frontend y compilación aprobados; navegación, peticiones HTTP y permisos equivalentes a la referencia inicial; ausencia de imports rotos y ciclos nuevos.

## Fase 4. Componentes y controles compartidos

**Objetivo:** reducir la repetición de estructura visual y dividir controles extensos por responsabilidad.

Tareas:

1. Extraer un contenedor de modal común para encabezado, cuerpo y acciones, respetando las variaciones de tamaño y comportamiento de cada pantalla.
2. Extraer componentes de campos, mensajes de error, estados de carga, badges y encabezados cuando exista repetición concreta.
3. Dividir `FieldControls.tsx` y `FieldDefinitionEditor.tsx` en controles y secciones identificables, conservando tipos, validaciones, autocompletado y cálculos actuales.
4. Centralizar estilos repetidos que representen componentes comunes. Mantener la presentación y el comportamiento actuales y comprobar la interacción con teclado y los nombres accesibles.

**Entregable:** componentes reutilizables y controles de formulario con responsabilidades delimitadas.

**Cierre:** pruebas frontend y E2E afectadas aprobadas; formularios, listas, adjuntos y modales conservan su interacción. Incorporar nuevas pruebas solo para riesgos concretos introducidos por la extracción.

## Fase 5. Responsabilidades del backend

**Objetivo:** hacer explícitas las dependencias compartidas y simplificar los servicios que reúnen varias tareas.

Tareas:

1. Separar extracción Jinja2, manejo de archivos, contexto de renderizado y verificación de variables residuales en módulos cohesivos. Mantener la coordinación del flujo en los servicios de plantillas y documentos.
2. Exponer un constructor de contexto de validación compartido para validación, generación y experimento; retirar imports entre servicios de funciones marcadas como privadas.
3. Ubicar las operaciones comunes de persistencia en un módulo con responsabilidad explícita, conservando exactamente sus límites de transacción, rollback y errores HTTP.
4. Organizar `rules/checks.py` por familias de reglas si el inventario confirma que mejora su lectura. Conservar catálogo, funciones y orden de ejecución.
5. Separar modelos de plantillas, valores y adjuntos actualmente agrupados en `models/dynamic_field.py` cuando su tamaño y dependencias lo justifiquen. Conservar nombres de tablas, identidad de clases y registro de metadatos SQLAlchemy.
6. Resolver la carpeta `repositories/`, actualmente sin implementación: mantener el acceso existente desde servicios y retirar la carpeta vacía si no tiene consumidores. Añadir una capa de repositorios requeriría una justificación concreta y un alcance propio.

**Entregable:** servicios de coordinación más legibles y módulos compartidos con interfaces públicas claras.

**Cierre:** comprobaciones backend aprobadas, esquema SQLite sin cambios y contratos de API equivalentes. Verificar reglas, generación DOCX, historial, permisos y exportaciones usando pruebas y datos sintéticos. Comparar contenido y resultados, no hashes binarios entre documentos generados en momentos distintos.

## Fase 6. Organización de pruebas

**Objetivo:** reducir duplicación en la preparación de escenarios y facilitar el mantenimiento de las pruebas existentes.

Tareas:

1. Extraer fixtures y factories de usuarios, clientes, expedientes y autenticación repetidas en las pruebas backend, manteniendo su aislamiento.
2. Centralizar constructores de DOCX sintéticos y recursos auxiliares usados por varias pruebas.
3. Organizar helpers frontend en `src/test/` cuando sean compartidos por varias funcionalidades.
4. Conservar las pruebas de cada módulo cerca de sus componentes y la separación backend entre pruebas unitarias e integración.
5. Actualizar imports y comprobar que se recogen los mismos escenarios, sin retirar aserciones para hacer pasar una reorganización.

**Entregable:** recursos de prueba compartidos y pruebas más fáciles de localizar.

**Cierre:** mismos escenarios disponibles y resultados equivalentes; bases de datos y almacenamiento temporal aislados. El entorno de pruebas no debe usar datos del bufete.

## Fase 7. Verificación integral y cierre

**Objetivo:** comprobar y documentar el resultado completo de la reorganización.

Tareas:

1. Ejecutar `scripts/test.ps1 -E2E` y registrar resultados de lint, formato, pytest, Vitest, compilación y navegador.
2. Comprobar el flujo integrado de datos sintéticos hasta un DOCX descargable con verificación de variables pendientes e historial de versiones. La prueba E2E actual cubre formularios dinámicos; no asumir que cubre todos los módulos.
3. Verificar generación del corpus y exportación del experimento en una base aislada, preservando el protocolo y sin inventar tiempos de investigación.
4. Comprobar preparación, arranque y respaldo con datos temporales en Windows.
5. Actualizar README, arquitectura, instalación, índice documental y mapa final de carpetas; retirar reexports temporales sin consumidores.
6. Registrar cambios estructurales, resultados y hallazgos fuera de alcance que se hayan encontrado.

**Entregable:** informe de cierre y documentación consistente con la estructura real.

**Cierre:** comprobaciones requeridas aprobadas y documentadas; cambios revisables; historial y archivos previos conservados. Una limitación que deje una comprobación requerida pendiente debe figurar como pendiente, no como fase completada.

## Criterios de cierre de cada entrega

1. Alcance, archivos modificados y motivo del cambio identificados.
2. Imports y documentación relacionados actualizados.
3. Comportamiento equivalente comprobado con las pruebas pertinentes.
4. Hallazgos preexistentes separados de regresiones nuevas.
5. Estado de la fase actualizado con comandos y resultados verificables.

Se aplican las [reglas permanentes del proyecto](../AGENTS.md) y los criterios pertinentes de la [definición de terminado](scrum/DEFINITION_OF_DONE.md). Una reorganización sin cambio de persistencia no requiere nuevas tablas ni migraciones; las comprobaciones se eligen según los archivos y flujos afectados. La verificación integral se realiza al cerrar el plan y se repite antes solo cuando nuevos cambios o fallos lo justifiquen.

## Registro de avances

| Fecha | Fase | Trabajo y evidencia | Estado |
|---|---|---|---|
| 2026-10-08 | Planificación | Plan creado a partir de la revisión de código, configuración y documentación. Las fases de ejecución aún no se han iniciado. | Plan documentado |
| 2026-10-08 | 0 | Preparación del entorno local y comprobaciones de referencia iniciadas. Se conservan los cambios previos de documentación. | En curso |
| 2026-10-08 | 0 | Entorno preparado; 254 pruebas backend, 85 frontend y un E2E aprobados, lint/formato y compilación aprobados. Referencias de API, esquema, permisos, reglas e inventario conservadas. Selectores obligatorios y desbordamiento de cabecera corregidos. [Informe y límites](testing/BASELINE_ESTRUCTURAL.md). | Completada |
| 2026-10-08 | 1 | Instalación repetible, configuración, archivo histórico y scripts operativos en revisión. Se conserva la referencia de la fase 0. | En curso |
| 2026-10-08 | 1 | Instalación nueva y repetida verificadas, versiones separadas y fijadas, configuración y scripts alineados, generadores archivados y respaldos preservados. Arranque/proxy, corpus y respaldos sintéticos aprobados en Windows PowerShell 5.1. Suite completa: 260 backend, 85 frontend y un E2E; contratos y esquema idénticos. [Informe](testing/FASE_1_ESTRUCTURAL.md). | Completada |
| 2026-10-08 | 0–1 | Entregas conservadas en el commit `a48ef71` antes de iniciar la documentación de la siguiente fase. | Commit creado |
| 2026-10-08 | 2 | Índice, arquitectura, mapa de módulos, enlaces y convenciones en revisión contra el código actual. | En curso |
| 2026-10-08 | 2 | Índice, arquitectura, persistencia, mapa de módulos y convenciones actualizados; enlaces internos, 11 operaciones API, 7 rutas frontend y 18 tablas comprobados. Documentación académica conservada y funcionalidades previstas identificadas; código y configuración sin cambios. [Informe](testing/FASE_2_ESTRUCTURAL.md). | Completada |
| 2026-10-08 | 2 | Entrega documental conservada en el commit `338d6b0` antes de reorganizar el frontend. | Commit creado |
| 2026-10-08 | 3 | Distribución de contratos y servicios HTTP por funcionalidad, extracción de composición y revisión de consumidores iniciadas. | En curso |
| 2026-10-08 | 3 | API y tipos distribuidos, cliente/errores comunes separados y composición extraída. 50 tipos y 13 declaraciones conservados; 102 pruebas frontend, un E2E, lint, tipos y build aprobados. Imports sin ciclos ni destinos rotos; navegación, permisos y cuerpos existentes equivalentes. [Informe](testing/FASE_3_ESTRUCTURAL.md). | Completada |
