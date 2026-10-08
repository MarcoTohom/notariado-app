# Cierre de la fase estructural 1

Fecha: 8 de octubre de 2026. Estado: completada.

Se unificó la preparación y operación local conservando las versiones verificadas y los contratos de la fase 0. Los cambios previos del usuario y de la fase inicial permanecen en el árbol de trabajo.

## Cambios entregados

- [setup.ps1](../../scripts/setup.ps1) prepara el entorno y las dependencias, admite una ruta explícita de Python y crea `.env` únicamente cuando falta. No ejecuta migraciones ni siembra datos. La clave local se genera sin imprimirla.
- [pyproject.toml](../../backend/pyproject.toml) centraliza pytest y Ruff; sustituye `pytest.ini`. Las dependencias directas y los registros exactos de ejecución/desarrollo se separan. Los registros fijan 46 paquetes de ejecución y 13 adicionales de desarrollo, incluidas dependencias transitivas, a las versiones de la fase 0. `package-lock.json` permanece intacto.
- Los ejemplos backend y frontend usan los nombres reales. Vite ahora lee `VITE_API_PROXY` también desde sus archivos de entorno. La [guía de instalación](../installation.md) explica prioridades, rutas, parámetros y procedimiento vigente.
- [common.ps1](../../scripts/common.ps1) reúne resolución de rutas, comprobación de requisitos y propagación de errores. Los scripts operativos restauran la carpeta de invocación. `dev.ps1 -Check` verifica backend, frontend y proxy y cierra sus procesos.
- [backup.ps1](../../scripts/backup.ps1) utiliza la configuración efectiva y [backup.py](../../scripts/backup.py). Incluye SQLite mediante su API de respaldo, plantillas, adjuntos y borradores; conserva copias anteriores y registra un manifiesto al terminar.
- Los generadores iniciales se conservan íntegros como texto en [archive/bootstrap](../archive/bootstrap/README.md). Se excluyen respaldos, logs y resultados operativos de Git. Solo se retiraron del índice tres marcadores del respaldo histórico; sus archivos físicos permanecen. Se conservaron o añadieron los marcadores de las carpetas operativas necesarias.
- Chromium se conserva fuera de `node_modules`, en `frontend/.cache/ms-playwright`, para que repetir `npm ci` no borre sus binarios.

## Comprobaciones ejecutadas

| Comprobación | Evidencia |
|---|---|
| Primera preparación en el proyecto real | `setup.ps1 -E2E` terminó con código 0 y creó `.env`; no creó `backend/app.db` |
| Preparación repetida | Windows PowerShell 5.1; hashes de `.env`, SQLite sintético, plantilla, borrador y `package-lock.json` idénticos antes/después; carpeta de invocación restaurada |
| Entorno nuevo en una ruta con espacios | `setup.ps1 -PythonExecutable ... -RuntimeOnly` terminó con código 0; exactamente 46 paquetes de ejecución con las versiones del registro; importación de la aplicación, DOCX, PDF y herramientas de datos aprobada |
| Requisitos Python | `pip check` aprobado tanto en el entorno del proyecto como en el entorno nuevo |
| Arranque y proxy | `dev.ps1 -Check -BackendPort 8012 -FrontendPort 5175` aprobado con SQLite y archivos temporales |
| Sembrador y corpus | Cuatro usuarios demo y 100 casos sintéticos; 20 por tipo, 50 con anomalías; sin registrar tiempos experimentales |
| Respaldos operativos | Dos carpetas distintas; ambas bases con integridad SQLite y 100 casos; hashes de plantilla y borrador iguales a sus originales |
| Nuevas pruebas de respaldo | Seis escenarios: datos WAL confirmados, versiones anteriores, base ausente, bases no respaldables y destinos dentro del almacenamiento |
| Configuración Vite desde archivo | Archivo de modo local en una copia temporal de la configuración; proxy resuelto al valor configurado |
| Suite completa | `test.ps1 -E2E`, invocado desde `docs` en Windows PowerShell 5.1, terminó con código 0 |
| Ruff | Lint y formato aprobados: 99 archivos backend; los dos helpers Python de `scripts` también comprobados |
| pytest | 260 aprobadas: 254 escenarios anteriores conservados y seis adicionales; 88,99 segundos |
| Frontend | ESLint aprobado; 85 pruebas en ocho archivos, 44,01 segundos |
| Compilación | TypeScript y Vite aprobados; 1.805 módulos |
| Navegador | Un E2E aprobado; 41,4 segundos incluyendo servidores |

Las comprobaciones operativas se ejecutaron en Windows PowerShell `5.1.26100.9444`. La preparación inicial y comprobaciones auxiliares también se ejecutaron en PowerShell 7. Las restricciones del sandbox requirieron ejecuciones autorizadas para instalación, servidores y pruebas, como en la fase 0.

## Comparación con la referencia inicial

Se capturó una nueva referencia sobre SQLite temporal y se compararon los JSON con [la referencia de la fase 0](BASELINE_ESTRUCTURAL.md):

- OpenAPI idéntico: 47 rutas, 62 operaciones y 67 esquemas.
- Esquema SQLite idéntico: 17 tablas de dominio más `alembic_version`; revisión `phase11_experiment`.
- Matriz de permisos y catálogo de las veinte reglas idénticos.
- Ningún escenario anterior retirado; los únicos seis escenarios nuevos pertenecen al respaldo.
- Código existente de aplicación y pruebas igual a la referencia verificada al cierre de la fase 0. Esta entrega añade pruebas operativas y modifica configuración/scripts, sin cambios en la lógica notarial ni en migraciones.

El contenido de los generadores archivados también se comparó con Git, normalizando únicamente la conversión de finales de línea de Windows. La [evidencia técnica en JSON](phase1/verification-results.json) conserva los resultados sin exportar configuración privada, credenciales ni filas de clientes.

## Límites y seguimiento

Las versiones fijadas tienen referencia verificada en Windows con Python 3.12. El E2E sigue cubriendo el formulario dinámico y la descarga de un adjunto CSV; la generación y descarga DOCX se comprueban en integración backend. Se mantienen los límites de cobertura de la fase 0 y no se deduce una reducción de tiempos a partir de estos resultados.

Permanecen las advertencias registradas sobre Starlette/httpx, anotaciones de Zod, el paquete JavaScript de 602,34 kB y el postinstall de esbuild sin aprobación. No impiden estas comprobaciones y no se actualizaron paquetes para eliminarlas. El respaldo termina con un manifiesto `complete`; una interrupción puede dejar una carpeta incompleta. La guía indica detener la aplicación para respaldar también los archivos de forma coherente.

La fase siguiente es documentación y convenciones: índice documental, enlaces restantes, mapa de módulos y pautas de organización. Su seguimiento permanece pendiente en el [plan estructural](../PLAN_MEJORA_ESTRUCTURAL.md).
