# Mapa de módulos implementados

Revisado el **8 de octubre de 2026** contra [las rutas FastAPI](../backend/app/api/v1/api.py), [las rutas React](../frontend/src/App.tsx) y los archivos de cada módulo. [Índice](README.md) · [Arquitectura](architecture.md) · [Convenciones](contributing.md).

## Pantallas y responsabilidades

Los prefijos de la tabla son relativos a `/api/v1`; OpenAPI detalla métodos, parámetros y permisos de cada operación. Las rutas de pantalla son de React. El permiso indicado controla el acceso a la pantalla; cada acción HTTP tiene su autorización en backend.

| Funcionalidad | Interfaz y acceso | API y servicio |
|---|---|---|
| Inicio y salud | `/`, [DashboardPage](../frontend/src/features/dashboard/DashboardPage.tsx), acceso público | `/health`, [health.py](../backend/app/api/v1/endpoints/health.py) |
| Sesión, usuarios y auditoría | [AuthContext](../frontend/src/context/AuthContext.tsx), [LoginModal](../frontend/src/components/LoginModal.tsx) y [UserManagementModal](../frontend/src/components/UserManagementModal.tsx); accesos desde la navegación | `/auth`, `/users`, `/audit`; [user_service](../backend/app/services/user_service.py), [audit_service](../backend/app/services/audit_service.py) |
| Clientes y personas jurídicas | `/clientes`, `clients:read`, [features/clients](../frontend/src/features/clients) | `/clients`, `/legal-entities`; [client_service](../backend/app/services/client_service.py), [legal_entity_service](../backend/app/services/legal_entity_service.py) |
| Expedientes y comparecientes | `/expedientes`, `cases:read`, [features/cases](../frontend/src/features/cases) | `/cases`; [case_service](../backend/app/services/case_service.py) |
| Formularios y captura | `/formularios`, `templates:read`, [features/fields](../frontend/src/features/fields); también desde un expediente | `/fields`; [dynamic_field_service](../backend/app/services/dynamic_field_service.py), [field_validation](../backend/app/services/field_validation.py) |
| Plantillas DOCX | `/plantillas`, `templates:read`, [features/templates](../frontend/src/features/templates) | `/templates`; [template_docx_service](../backend/app/services/template_docx_service.py) |
| Consistencia documental | [CaseValidationModal](../frontend/src/features/validation/CaseValidationModal.tsx) y [FindingsPanel](../frontend/src/features/validation/FindingsPanel.tsx), desde Expedientes | `/validations`; [validation_service](../backend/app/services/validation_service.py), [rules](../backend/app/rules) |
| Borradores e historial | `/documentos`, `documents:read`, [features/documents](../frontend/src/features/documents) | `/documents`; [document_generation_service](../backend/app/services/document_generation_service.py) |
| Experimento | `/tesis`, `experiment:read`, [features/experiment](../frontend/src/features/experiment) | `/experiment`; [experiment_service](../backend/app/services/experiment_service.py), [synthetic_data](../backend/app/utils/synthetic_data.py) |

Los esquemas se localizan en [schemas](../backend/app/schemas), la persistencia en [models](../backend/app/models) y el detalle de tablas en [database.md](database.md). La interfaz usa actualmente [services/api.ts](../frontend/src/services/api.ts) y [types/index.ts](../frontend/src/types/index.ts); campos dinámicos tiene [api.ts](../frontend/src/features/fields/api.ts) y [types.ts](../frontend/src/features/fields/types.ts) propios. Su distribución se completará en la fase estructural 3.

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
| Operación y navegador | [test_backup_operations](../backend/tests/unit/test_backup_operations.py), [dynamic-fields.spec.ts](../frontend/e2e/dynamic-fields.spec.ts) |

[test.ps1](../scripts/test.ps1) ejecuta calidad, backend, frontend y compilación; `-E2E` añade el escenario de campos dinámicos. Los [informes de verificación](testing/FASE_1_ESTRUCTURAL.md) detallan resultados y límites de cobertura.

## Funcionalidades previstas

La ingesta de XLSX/CSV/PDF y las cotizaciones, presupuestos, cobros y pagos siguen en la especificación y backlog. No tienen actualmente el conjunto de modelos, servicios, API y pantallas requerido para considerarlas implementadas. El adjunto de campos permite guardar y descargar archivos; no ejecuta esa ingesta. El MVP excluye OCR e IA generativa externa.

La fase funcional 11 tiene un módulo de medición operativo. La investigación sobre reducción de tiempos requiere ejecutar y registrar el protocolo con 100 casos; no se declara completada por la presencia del módulo. Las fases funcionales del [plan maestro](MASTER_PLAN.md) y las fases de [reorganización estructural](PLAN_MEJORA_ESTRUCTURAL.md) tienen seguimiento separado.
