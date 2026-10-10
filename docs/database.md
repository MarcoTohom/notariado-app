# Persistencia actual: SQLite y archivos locales

Revisada el **8 de octubre de 2026**. [Índice](README.md) · [Arquitectura](architecture.md) · [Instalación y respaldo](installation.md).

## Configuración y esquema

SQLAlchemy 2.x utiliza SQLite y Alembic versiona las migraciones de [backend/alembic](../backend/alembic). La ubicación predeterminada es `backend/app.db`, resuelta a una ruta absoluta; `DATABASE_URL` permite cambiarla. Plantillas y adjuntos se guardan en `backend/uploads`, borradores en `backend/generated`. La configuración y los scripts consultan las rutas efectivas.

La referencia tiene **17 tablas de dominio y `alembic_version`**, con revisión `phase11_experiment`. [El esquema conservado](testing/baseline/2026-10-08/database-schema.json) contiene columnas, índices y relaciones. Las fases estructurales 1 y 5 comprobaron que permanece igual a la referencia inicial, incluidos índices y relaciones.

| Tablas | Modelo y propósito |
|---|---|
| `users` | [user.py](../backend/app/models/user.py): identidad, rol y estado |
| `audit_logs` | [audit.py](../backend/app/models/audit.py): acciones y trazabilidad |
| `clients`, `legal_entities` | [client.py](../backend/app/models/client.py), [legal_entity.py](../backend/app/models/legal_entity.py): fichas de personas individuales y jurídicas |
| `cases`, `case_parties` | [case.py](../backend/app/models/case.py), [case_party.py](../backend/app/models/case_party.py): expedientes y comparecientes |
| `templates`, `template_versions`, `template_fields` | [template.py](../backend/app/models/template.py) y [dynamic_field.py](../backend/app/models/dynamic_field.py): plantillas, versiones y definiciones de campos |
| `case_field_values`, `field_attachments` | [case_field_values.py](../backend/app/models/case_field_values.py) y [field_attachment.py](../backend/app/models/field_attachment.py): valores JSON por expediente/versión y metadatos de adjuntos |
| `validation_runs` | [validation.py](../backend/app/models/validation.py): historial de hallazgos |
| `documents`, `document_versions` | [document.py](../backend/app/models/document.py): borradores, versiones, snapshots y estado de verificación |
| `test_cases`, `test_executions`, `time_measurements` | [experiment.py](../backend/app/models/experiment.py): corpus, revisiones completas y duración de etapas |

## Representación de datos

- DPI: `String(13)` y validación de 13 dígitos; permanece texto para conservar ceros iniciales.
- NIT de clientes y personas jurídicas: `String(20)`. Los validadores y las reglas aplican las restricciones correspondientes; no se convierte a entero.
- Dinero y campos decimales: cálculo con `Decimal`, transporte como texto y almacenamiento de valores de formulario en JSON. No existe actualmente un conjunto de tablas financieras con columnas `Numeric(12, 2)`; ese módulo está previsto.
- Identificadores de dominio: UUID en `String(36)`. [IdentifiableMixin](../backend/app/models/base.py) incorpora los timestamps de [TimestampMixin](../backend/app/db/base.py).
- Medición: `test_executions` guarda inicio, fin, duración total y conteos; `time_measurements` guarda etapas vinculadas a la ejecución. Los minutos totales se almacenan como texto decimal y los segundos como entero.

## Versiones y conservación

Los valores capturados se vinculan a una versión concreta; `revision` permite detectar guardados concurrentes. Plantillas y documentos registran versiones nuevas, sin sobrescribir las previas. Los estados y metadatos documentales permiten distinguir un borrador verificado de un archivo con variables residuales.

[backup.ps1](../scripts/backup.ps1) utiliza la configuración vigente y [backup.py](../scripts/backup.py) copia SQLite mediante su API de respaldo, incluidos datos confirmados en WAL, además de `uploads` y `generated`. La guía describe el manifiesto de copia completa y las condiciones de operación. Las pruebas usan bases y archivos sintéticos aislados; las bases operativas y los respaldos quedan fuera de Git.
