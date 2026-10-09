# Fase estructural 5: responsabilidades del backend

Fecha: 8 de octubre de 2026. Referencia anterior: `8531a74`.

Se separaron análisis Jinja2 y variables residuales, contexto de renderizado y manejo de archivos en `services/docx/`. Los servicios de plantillas y documentos conservan la coordinación, persistencia e historial. `validation_context.py` ofrece un constructor público utilizado por validación, generación y experimento; `db/operations.py` concentra las operaciones ya existentes de persistencia sin alterar transacciones ni errores HTTP. La comprobación de adjuntos está en `file_validation.py`.

Las reglas se distribuyen entre identidad, fechas/importes, registro y documento; `checks.py` mantiene el registro y orden original. Los modelos de plantillas, valores y adjuntos tienen archivos propios y el registro SQLAlchemy conserva sus clases y tablas. Se retiró `repositories/`, que solo contenía un inicializador sin consumidores.

## Comprobaciones ejecutadas

- Ruff: lint y formato aprobados, 113 archivos backend.
- Pytest: **260 aprobadas** en 69,39 segundos; permisos, adjuntos, reglas, corpus, exportaciones, generación, descarga autenticada e historial siguen cubiertos.
- [Verificador reproducible](phase5/verify-structure.py): compara por AST las declaraciones movidas y conservadas con el commit anterior, incluyendo límites de transacción y orden de reglas. Aplica Alembic en SQLite temporal y compara el esquema completo y OpenAPI con la referencia inicial.
- [Resultados de equivalencia](phase5/structure-verification.json) y [resultados de ejecución](phase5/verification-results.json).

No se modificaron migraciones, catálogo, permisos, contratos Pydantic ni dependencias. Las pruebas usan SQLite en memoria o temporal y documentos sintéticos. Permanece el aviso previo de deprecación de Starlette/httpx; no se actualizan dependencias durante esta reorganización. La verificación conjunta frontend y navegador corresponde a la fase 7.
