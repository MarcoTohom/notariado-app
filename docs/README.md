# Índice de documentación

Referencia del código revisada el **8 de octubre de 2026**. El sistema organiza clientes y expedientes, captura campos tipados, valida consistencia y genera borradores DOCX en un entorno local. El Notario conserva la revisión y autorización del documento.

## Instalación y uso

| Documento | Contenido |
|---|---|
| [Inicio rápido](../README.md) | Requisitos, comandos y antecedentes de desarrollo |
| [Instalación](installation.md) | Preparación repetible, configuración, arranque, respaldo y corpus sintético en Windows |
| [Campos dinámicos](dynamic-fields.md) | Configuración de formularios, tipos, adjuntos y contratos de captura |
| [Mapa de módulos](modules.md) | Pantallas, permisos, API, servicios y pruebas actuales |

## Desarrollo y verificación

| Documento | Contenido |
|---|---|
| [Arquitectura](architecture.md) | Capas actuales, comunicación local y decisiones de organización |
| [Persistencia](database.md) | Tablas, versiones y representación de datos |
| [Convenciones de contribución](contributing.md) | Ubicación de código, dependencias, imports y comprobaciones |
| [Plan de mejora estructural](PLAN_MEJORA_ESTRUCTURAL.md) | Fases estructurales 0–7 y seguimiento |
| [Referencia inicial: fase 0](testing/BASELINE_ESTRUCTURAL.md) | Inventario y contratos conservados antes de reorganizar |
| [Entorno y scripts: fase 1](testing/FASE_1_ESTRUCTURAL.md) | Instalación y operación verificadas; 260 pruebas backend, 85 frontend y un E2E aprobados |
| [Documentación: fase 2](testing/FASE_2_ESTRUCTURAL.md) | Cambios documentales y comprobación de referencias |
| [Organización frontend: fase 3](testing/FASE_3_ESTRUCTURAL.md) | API y tipos por funcionalidad, composición y pruebas de equivalencia |
| [Componentes y controles: fase 4](testing/FASE_4_ESTRUCTURAL.md) | UI común, controles y editor por responsabilidad; 111 pruebas frontend y dos E2E |
| [Responsabilidades backend: fase 5](testing/FASE_5_ESTRUCTURAL.md) | DOCX, contexto, persistencia, modelos y reglas separados; equivalencia de API y SQLite |
| [Recursos de pruebas: fase 6](testing/FASE_6_ESTRUCTURAL.md) | Preparación compartida; 151 funciones y 260 identificadores conservados |
| [Verificación integral: fase 7](testing/FASE_7_ESTRUCTURAL.md) | Cierre de fases 0–7; suite, DOCX e historial, corpus y operación Windows |
| [Generadores archivados](archive/bootstrap/README.md) | Antecedentes de preparación, conservados como texto |

Los informes fechados son evidencia de sus respectivas ejecuciones. Los E2E cubren campos dinámicos, formularios/modales y carga/activación/captura/validación/generación DOCX con historial. Las descargas de borradores se verifican mediante la API autenticada; el informe final precisa este límite de interfaz.

## Planificación y documentación académica

| Documento | Contenido |
|---|---|
| [Plan maestro funcional](MASTER_PLAN.md) | Once fases funcionales y dependencias |
| [Especificación original](PROJECT_SPEC.md) | Requisitos y estructura objetivo, incluidos módulos pendientes |
| [Product Backlog](scrum/PRODUCT_BACKLOG.md) | Épicas e historias de usuario |
| [Planificación de sprints](scrum/SPRINT_PLANNING.md) | Cronograma y distribución del trabajo |
| [Definición de terminado](scrum/DEFINITION_OF_DONE.md) | Criterios de aceptación y calidad |
| [Presentación ejecutiva](presentation/PRESENTACION_EJECUTIVA_PROYECTO.md) | Propuesta y guion de defensa académica |
| [Pruebas y protocolo experimental](testing/TEST_PLAN_AND_EXPERIMENT.md) | Diseño de evaluación y correspondencia con el módulo de medición |

La planificación conserva el alcance original. Importación XLSX/CSV/PDF y administración financiera siguen previstas. La carga de un adjunto no ejecuta una importación ni extrae su texto. `pypdf` comprueba la estructura de adjuntos PDF; no hay un módulo operativo de extracción de su texto.

El módulo de tesis permite generar 100 casos sintéticos, registrar revisiones y exportar resultados. **240 → 60 minutos es una meta experimental**: instalar el sistema, generar el corpus o aprobar pruebas de software no demuestra esa reducción. Los resultados requieren mediciones registradas.

Las [reglas permanentes](../AGENTS.md) y el [mapa de módulos](modules.md) sirven como referencia para nuevas entregas. Al reorganizar código, actualizar este índice y las guías afectadas.
