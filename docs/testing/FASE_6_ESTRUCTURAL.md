# Fase estructural 6: recursos compartidos de pruebas

Fecha: 8 de octubre de 2026. Referencia anterior: `05348e4`.

`backend/tests/support/` reúne la creación de cuentas sintéticas, login HTTP real y cabeceras Bearer, constructores DOCX con párrafos/tablas y la preparación de cliente/expediente con compareciente. Los helpers tienen consumidores concretos en clientes, expedientes, plantillas, validación, documentos y experimento. Los escenarios específicos, archivos inválidos y comprobaciones de permisos permanecen junto a sus pruebas.

La sesión SQLite conserva la transacción exterior y los savepoints. Los archivos siguen aislados mediante `tmp_path`. La fixture de TestClient libera los overrides en `finally`, incluso si falla el escenario. No se sustituye el login real por tokens simulados.

## Equivalencia

[El verificador](phase6/verify-tests.py) compara las **151 funciones de prueba**, incluidos decoradores y aserciones, por AST con el commit anterior. Recoge los **260 mismos identificadores**, incluidos los seis escenarios de respaldo añadidos en fase 1. [Inventario](phase6/test-inventory.json) y [resultado](phase6/structure-verification.json).

Frontend conserva las 111 pruebas en sus funcionalidades y `src/test/setup.ts`. La preparación específica no tiene múltiples consumidores que justifiquen nuevos helpers compartidos. No se añadieron carpetas vacías ni abstracciones sin uso.

Código de producción, dependencias, contratos y frontend sin modificaciones. Los resultados de lint, formato y ejecución backend se registran en [verification-results.json](phase6/verification-results.json). La fase 7 ejecuta además la suite conjunta.
