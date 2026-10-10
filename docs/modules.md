# Mapa de módulos implementados

Revisado el **8 de octubre de 2026** contra [las rutas FastAPI](../backend/app/api/v1/api.py), [las rutas React](../frontend/src/app/AppRoutes.tsx) y los archivos de cada módulo. [Índice](README.md) · [Arquitectura](architecture.md) · [Convenciones](contributing.md).

## Pantallas y responsabilidades

Los prefijos de la tabla son relativos a `/api/v1`; OpenAPI detalla métodos, parámetros y permisos de cada operación. Las rutas de pantalla son de React. El permiso indicado controla el acceso a la pantalla; cada acción HTTP tiene su autorización en backend.

| Funcionalidad | Interfaz y acceso | API y servicio |
|---|---|---|
| Inicio y salud | `/`, [DashboardPage](../frontend/src/features/dashboard/DashboardPage.tsx), acceso público | `/health`, [health.py](../backend/app/api/v1/endpoints/health.py) |
| Sesión, usuarios y auditoría | [AuthContext](../frontend/src/features/auth/AuthContext.tsx), [LoginModal](../frontend/src/features/auth/LoginModal.tsx) y [UserManagementModal](../frontend/src/features/users/UserManagementModal.tsx); accesos desde la navegación | `/auth`, `/users`, `/audit`; [user_service](../backend/app/services/user_service.py), [audit_service](../backend/app/services/audit_service.py) |
| Clientes y personas jurídicas | `/clientes`, `clients:read`, [features/clients](../frontend/src/features/clients) | `/clients`, `/legal-entities`; [client_service](../backend/app/services/client_service.py), [legal_entity_service](../backend/app/services/legal_entity_service.py) |
| Expedientes y comparecientes | `/expedientes`, `cases:read`, [features/cases](../frontend/src/features/cases) | `/cases`; [case_service](../backend/app/services/case_service.py) |
| Formularios y captura | `/formularios`, `templates:read`, [features/fields](../frontend/src/features/fields); también desde un expediente | `/fields`; [dynamic_field_service](../backend/app/services/dynamic_field_service.py), [field_validation](../backend/app/services/field_validation.py) |
| Plantillas DOCX | `/plantillas`, `templates:read`, [features/templates](../frontend/src/features/templates) | `/templates`; [template_docx_service](../backend/app/services/template_docx_service.py) |
| Consistencia documental | [CaseValidationModal](../frontend/src/features/validation/CaseValidationModal.tsx) y [FindingsPanel](../frontend/src/features/validation/FindingsPanel.tsx), desde Expedientes | `/validations`; [validation_service](../backend/app/services/validation_service.py), [rules](../backend/app/rules) |
| Borradores e historial | `/documentos`, `documents:read`, [features/documents](../frontend/src/features/documents) | `/documents`; [document_generation_service](../backend/app/services/document_generation_service.py) |
| Experimento | `/tesis`, `experiment:read`, [features/experiment](../frontend/src/features/experiment) | `/experiment`; [experiment_service](../backend/app/services/experiment_service.py), [synthetic_data](../backend/app/utils/synthetic_data.py) |

Los esquemas se localizan en [schemas](../backend/app/schemas), la persistencia en [models](../backend/app/models) y el detalle de tablas en [database.md](database.md). Cada funcionalidad frontend tiene sus llamadas HTTP y contratos propios. El [cliente común](../frontend/src/shared/api/client.ts) mantiene configuración y sesión; [errors.ts](../frontend/src/shared/api/errors.ts) mantiene los mensajes de error. [shared/types.ts](../frontend/src/shared/types.ts) contiene CaseType, utilizado por varios módulos.

## API y contratos frontend

| Funcionalidad | Llamadas HTTP | Contratos |
|---|---|---|
| Inicio y salud | [dashboard/api.ts](../frontend/src/features/dashboard/api.ts) | [dashboard/types.ts](../frontend/src/features/dashboard/types.ts) |
| Sesión | [auth/api.ts](../frontend/src/features/auth/api.ts) | [auth/types.ts](../frontend/src/features/auth/types.ts) |
| Usuarios | [users/api.ts](../frontend/src/features/users/api.ts) | [users/types.ts](../frontend/src/features/users/types.ts) |
| Auditoría | [audit/api.ts](../frontend/src/features/audit/api.ts) | [audit/types.ts](../frontend/src/features/audit/types.ts) |
| Clientes y personas jurídicas | [clients/api.ts](../frontend/src/features/clients/api.ts) | [clients/types.ts](../frontend/src/features/clients/types.ts) |
| Expedientes | [cases/api.ts](../frontend/src/features/cases/api.ts) | [cases/types.ts](../frontend/src/features/cases/types.ts) |
| Campos | [fields/api.ts](../frontend/src/features/fields/api.ts) | [fields/types.ts](../frontend/src/features/fields/types.ts) |
| Plantillas | [templates/api.ts](../frontend/src/features/templates/api.ts) | [templates/types.ts](../frontend/src/features/templates/types.ts) |
| Validación | [validation/api.ts](../frontend/src/features/validation/api.ts) | [validation/types.ts](../frontend/src/features/validation/types.ts) |
| Borradores | [documents/api.ts](../frontend/src/features/documents/api.ts) | [documents/types.ts](../frontend/src/features/documents/types.ts) |
| Experimento | [experiment/api.ts](../frontend/src/features/experiment/api.ts) | [experiment/types.ts](../frontend/src/features/experiment/types.ts) |

[AppProviders](../frontend/src/app/AppProviders.tsx) compone TanStack Query, sesión y BrowserRouter. [AppRoutes](../frontend/src/app/AppRoutes.tsx) conserva rutas y permisos; [AppLayout](../frontend/src/app/AppLayout.tsx) contiene navegación y pie. [RequireAuth](../frontend/src/features/auth/RequireAuth.tsx) conserva los estados de carga, inicio de sesión y acceso restringido.

## UI compartida y campos

| Responsabilidad | Ubicación y consumidores |
|---|---|
| Modal, cabecera, cuerpo y acciones | [Modal.tsx](../frontend/src/components/common/Modal.tsx); once modales de funcionalidades y [ConfirmDialog](../frontend/src/components/common/ConfirmDialog.tsx) |
| Mensajes y carga | [Feedback.tsx](../frontend/src/components/common/Feedback.tsx); formularios, listas, detalles y acceso |
| Badges y estilos de formulario | [Badge.tsx](../frontend/src/components/common/Badge.tsx), [formStyles.ts](../frontend/src/components/common/formStyles.ts); consumidores conservan sus colores y variantes |
| Registro y renderizado de veinte tipos | [FieldControls.tsx](../frontend/src/features/fields/FieldControls.tsx); consumido por DynamicForm y listas anidadas |
| Controles de captura | [controls](../frontend/src/features/fields/controls); BasicInputs, TextInputs, SelectInput, RelationInput, FileInput y ListInput |
| Coordinación del editor | [FieldDefinitionEditor.tsx](../frontend/src/features/fields/FieldDefinitionEditor.tsx); orden, expansión y edición anidada |
| Secciones del editor | [editor](../frontend/src/features/fields/editor); DefinitionSettings, DefinitionOptions y DefinitionRestrictions, con defaults y controles auxiliares |

Los componentes comunes reciben presentación y acciones. Las consultas, permisos, payloads y estados de negocio permanecen en cada funcionalidad. [Informe de la extracción](testing/FASE_4_ESTRUCTURAL.md).

## Operaciones de generación y medición

Estas rutas completas corresponden al contrato de referencia:

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/v1/validations/run` | Ejecutar reglas y guardar una corrida |
| POST | `/api/v1/documents/generate` | Generar una nueva versión de borrador |
| POST | `/api/v1/experiment/cases/generate` | Crear el corpus sintético |
| GET | `/api/v1/experiment/cases` | Consultar casos del corpus |
| POST | `/api/v1/experiment/executions/start` | Iniciar revisión tradicional o con sistema |
| POST | `/api/v1/experiment/executions/{execution_id}/finish` | Finalizar revisión y calcular su duración |
| POST | `/api/v1/experiment/executions/{execution_id}/stages/start` | Iniciar una etapa |
| POST | `/api/v1/experiment/stages/{measurement_id}/finish` | Finalizar una etapa |
| GET | `/api/v1/experiment/stats` | Consultar estadísticas de ejecuciones finalizadas |
| GET | `/api/v1/experiment/export.xlsx` | Exportar resultados XLSX |
| GET | `/api/v1/experiment/export.csv` | Exportar resultados CSV |

El [OpenAPI conservado](testing/baseline/2026-10-08/openapi.json) contiene 47 rutas y 62 operaciones. Estos números describen la referencia inicial y se mantuvieron en la fase estructural 1. [El protocolo experimental](testing/TEST_PLAN_AND_EXPERIMENT.md) explica corpus y mediciones; generar casos no registra tiempos de revisión.

## Ubicación de pruebas

| Área | Pruebas existentes |
|---|---|
| Sesión, usuarios y auditoría | [test_auth_api](../backend/tests/integration/test_auth_api.py), [test_users_api](../backend/tests/integration/test_users_api.py), [test_audit_api](../backend/tests/integration/test_audit_api.py), [test_security](../backend/tests/unit/test_security.py) |
| Clientes y expedientes | [test_clients_api](../backend/tests/integration/test_clients_api.py), [test_cases_api](../backend/tests/integration/test_cases_api.py), [ClientFormModal](../frontend/src/features/clients/__tests__/ClientFormModal.test.tsx) |
| Campos y formularios | [test_dynamic_fields](../backend/tests/unit/test_dynamic_fields.py), [test_dynamic_fields_api](../backend/tests/integration/test_dynamic_fields_api.py), [test_field_migrations](../backend/tests/integration/test_field_migrations.py), [pruebas React](../frontend/src/features/fields/__tests__) |
| Plantillas | [test_jinja_extraction](../backend/tests/unit/test_jinja_extraction.py), [test_templates_api](../backend/tests/integration/test_templates_api.py), [TemplateUploadModal](../frontend/src/features/templates/__tests__/TemplateUploadModal.test.tsx) |
| Reglas | [test_rule_engine](../backend/tests/unit/test_rule_engine.py), [test_number_words](../backend/tests/unit/test_number_words.py), [test_validations_api](../backend/tests/integration/test_validations_api.py), [FindingsPanel](../frontend/src/features/validation/__tests__/FindingsPanel.test.tsx) |
| Documentos | [test_document_context](../backend/tests/unit/test_document_context.py), [test_documents_api](../backend/tests/integration/test_documents_api.py), [DocumentVersionsList](../frontend/src/features/documents/__tests__/DocumentVersionsList.test.tsx) |
| Experimento | [test_experiment_corpus](../backend/tests/unit/test_experiment_corpus.py), [test_experiment_api](../backend/tests/integration/test_experiment_api.py), [ExperimentStatsCards](../frontend/src/features/experiment/__tests__/ExperimentStatsCards.test.tsx) |
| Operación y navegador | [test_backup_operations](../backend/tests/unit/test_backup_operations.py), [dynamic-fields.spec.ts](../frontend/e2e/dynamic-fields.spec.ts), [shared-modals.spec.ts](../frontend/e2e/shared-modals.spec.ts) |
| Transporte y permisos frontend | [client.test](../frontend/src/shared/api/__tests__/client.test.ts), [errors.test](../frontend/src/shared/api/__tests__/errors.test.ts), [RequireAuth.test](../frontend/src/features/auth/__tests__/RequireAuth.test.tsx) |
| UI común y editor | [Modal.test](../frontend/src/components/common/__tests__/Modal.test.tsx), [FieldDefinitionEditor.test](../frontend/src/features/fields/__tests__/FieldDefinitionEditor.test.tsx) |

[test.ps1](../scripts/test.ps1) ejecuta calidad, backend, frontend y compilación; `-E2E` añade los escenarios de campos dinámicos, modales y DOCX con historial y descarga por API autenticada. Los informes de [fase 1](testing/FASE_1_ESTRUCTURAL.md), [fase 3](testing/FASE_3_ESTRUCTURAL.md) y [fase 4](testing/FASE_4_ESTRUCTURAL.md) detallan resultados y límites de cobertura.

## Funcionalidades previstas

La ingesta de XLSX/CSV/PDF y las cotizaciones, presupuestos, cobros y pagos siguen en la especificación y backlog. No tienen actualmente el conjunto de modelos, servicios, API y pantallas requerido para considerarlas implementadas. El adjunto de campos permite guardar y descargar archivos; no ejecuta esa ingesta. El MVP excluye OCR e IA generativa externa.

La fase funcional 11 tiene un módulo de medición operativo. La investigación sobre reducción de tiempos requiere ejecutar y registrar el protocolo con 100 casos; no se declara completada por la presencia del módulo. Las fases funcionales del [plan maestro](MASTER_PLAN.md) y las fases de [reorganización estructural](PLAN_MEJORA_ESTRUCTURAL.md) tienen seguimiento separado.

## Módulos compartidos backend y pruebas

| Responsabilidad | Módulo propietario |
|---|---|
| Contexto de reglas, documentos y experimento | [validation_context.py](../backend/app/services/validation_context.py) |
| Commit, flush y búsqueda con errores existentes | [db/operations.py](../backend/app/db/operations.py) |
| Comprobación de estructura de archivos | [file_validation.py](../backend/app/services/file_validation.py) |
| Jinja2, variables residuales, contexto y rutas DOCX | [services/docx](../backend/app/services/docx) |
| Familias de reglas y orden estable | [rules](../backend/app/rules), registro en checks.py |
| Plantillas, valores y adjuntos | [models](../backend/app/models), módulos propios; detalles en database.md |
| Cuentas, autenticación, cliente/expediente y DOCX sintéticos | [tests/support](../backend/tests/support) |
| Recorrido DOCX de navegador | [documents.spec.ts](../frontend/e2e/documents.spec.ts), descarga autenticada y verificación python-docx |

[La fase 7](testing/FASE_7_ESTRUCTURAL.md) conserva 47 rutas API/62 operaciones, 18 tablas y los 260 escenarios backend; añade un tercer E2E para DOCX.
