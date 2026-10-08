# Instalación y operación local en Windows 10/11

[Índice documental](README.md) · [Mapa de módulos](modules.md) · [Convenciones de contribución](contributing.md).

La preparación nueva y repetida y los comandos operativos de esta guía se verificaron en la [fase estructural 1](testing/FASE_1_ESTRUCTURAL.md), con Windows PowerShell 5.1. Esta fase documental conserva ese procedimiento.

## Requisitos

- Windows PowerShell 5.1 o PowerShell 7+.
- Python 3.12+ y Node.js 22.13+ con npm. La referencia actual se verificó con Python 3.12.14, Node.js 24.19.0 y npm 11.17.0.
- Git para mantener el repositorio. La primera instalación descarga paquetes; la aplicación y sus pruebas funcionan localmente después de preparar las dependencias.

Todos los scripts resuelven la raíz desde su propia ubicación y restauran la carpeta desde la que se invocaron, incluso si hay errores. No es necesario activar el entorno virtual.

## Preparación

Desde la carpeta real del repositorio:

```powershell
.\scripts\setup.ps1 -E2E
```

El script comprueba Node.js, crea `backend/.venv` si falta, instala dependencias Python y frontend desde sus registros de versiones, verifica `pip check` y prepara Chromium cuando se solicita `-E2E`. Crea el archivo `.env` en la raíz únicamente si falta, con una clave local aleatoria que no imprime. No aplica migraciones ni siembra datos. Al repetirlo conserva `.env`, SQLite, plantillas, adjuntos, borradores y respaldos; `npm ci` vuelve a preparar `node_modules`.

Si el Python disponible en PATH es un alias de WindowsApps, indicar un ejecutable válido:

```powershell
.\scripts\setup.ps1 -PythonExecutable 'D:\ruta\a\python.exe' -E2E
```

Con un entorno virtual existente, se usa su intérprete. Sin entorno, la búsqueda utiliza la ruta explícita, luego `py -3` y después `python`. Un intérprete ausente, inválido o anterior a 3.12 detiene la instalación; no modifica el PATH global.

`-RuntimeOnly` instala únicamente las dependencias de ejecución Python. No elimina herramientas que ya estén instaladas. Para desarrollar o ejecutar pruebas, utilizar la instalación predeterminada.

## Dependencias y herramientas

| Archivo | Responsabilidad |
|---|---|
| `backend/requirements.txt` | Dependencias directas de ejecución con límites mínimos |
| `backend/requirements-dev.txt` | Dependencias anteriores más herramientas de pruebas y calidad |
| `backend/requirements-lock.txt` | 46 paquetes de ejecución, incluidas dependencias transitivas, con versiones verificadas |
| `backend/requirements-dev-lock.txt` | Registro anterior más 13 paquetes para desarrollo y pruebas |
| `frontend/package-lock.json` | Versiones frontend; se instala mediante `npm ci` |
| `backend/pyproject.toml` | Configuración de pytest y Ruff |

Los registros Python conservan las versiones instaladas y verificadas en la fase 0. Su referencia es Windows con Python 3.12; no se asume compatibilidad verificada con todas las versiones posteriores de Python. No contienen credenciales ni rutas de otra computadora. Una actualización de paquetes exige regenerar los registros y repetir las comprobaciones pertinentes; cambiar solamente los límites mínimos no modifica lo que instala `setup.ps1`.

La caché de instalación se guarda en `backend/.venv/cache`. Chromium se guarda en `frontend/.cache/ms-playwright`, separado de `node_modules`. Los scripts también respetan una variable de proceso `PLAYWRIGHT_BROWSERS_PATH` explícita. Estos archivos no se versionan. Para ejecutar Playwright directamente fuera de `test.ps1`, indicar la misma ruta de navegadores.

## Configuración backend

El backend lee `.env` desde la raíz del repositorio, independientemente de la carpeta desde la que se importe su configuración. Las variables de proceso tienen prioridad sobre ese archivo. Los nombres vigentes están en [.env.example](../.env.example).

- `PROJECT_NAME`, `VERSION` y `API_V1_STR` identifican la aplicación y el prefijo API. `APP_NAME` y `APP_VERSION` no son nombres utilizados por la configuración actual.
- `DATABASE_URL` vacío utiliza una ruta absoluta a `backend/app.db`. Para una ubicación distinta, preferir una URI absoluta, por ejemplo `sqlite:///D:/datos/notariado/app.db`. El caso heredado `sqlite:///./app.db` también apunta a la base predeterminada.
- Al omitir `UPLOAD_DIR` y `GENERATED_DIR`, las rutas predeterminadas son `backend/uploads` y `backend/generated` absolutas. Las rutas relativas explícitas se resuelven desde la carpeta de trabajo de Python; los scripts operativos ejecutan Python desde `backend`.
- `HOST` y `PORT` configuran el backend. `dev.ps1` utiliza esos valores; `-BackendPort` permite sobrescribir el puerto para una ejecución.
- `CORS_ORIGINS` se expresa como una lista JSON. Las variables de seguridad y los parámetros experimentales conservan sus nombres actuales.

El instalador no sobrescribe una configuración existente. Si se conserva un `.env` antiguo, revisar manualmente sus nombres y rutas con el ejemplo vigente, sin copiarlo encima.

## Configuración frontend

Vite lee los archivos `.env`, `.env.local` y sus variantes de modo desde `frontend`, no desde la raíz del repositorio. [frontend/.env.example](../frontend/.env.example) documenta las dos variables usadas:

- `VITE_API_URL`: base pública de Axios; por defecto `/api/v1`.
- `VITE_API_PROXY`: servidor backend al que apunta el proxy de desarrollo; por defecto `http://127.0.0.1:8000`. Se lee desde los archivos de Vite o el entorno del proceso. `dev.ps1` lo establece para que coincida con el backend que acaba de iniciar.

Estas variables son públicas; no colocar claves, contraseñas ni tokens en ellas. Al cambiar el prefijo `API_V1_STR`, alinear también `VITE_API_URL`. Los cambios de configuración requieren reiniciar Vite; las variables del cliente se incorporan durante la compilación.

## Comprobación y arranque

```powershell
.\scripts\test.ps1
.\scripts\test.ps1 -E2E
```

La segunda variante añade el escenario de navegador con servidores, base y archivos temporales. `test.ps1` prepara su carpeta temporal y configura la ubicación de Chromium automáticamente. Un fallo de cualquier herramienta detiene el script y produce un error; no se anuncia éxito después de un fallo.

Para crear o restablecer las cuentas demo sintéticas:

```powershell
.\scripts\seed.ps1
```

El sembrador aplica migraciones y restablece los perfiles y contraseñas de las cuentas demo existentes. Ejecutarlo solamente cuando se desean esos usuarios. La instalación no lo ejecuta automáticamente.

```powershell
.\scripts\dev.ps1
# Arranca, comprueba backend/frontend/proxy y cierra sus procesos:
.\scripts\dev.ps1 -Check
```

`dev.ps1` aplica las migraciones antes de arrancar. El backend predeterminado está en `http://127.0.0.1:8000`; la interfaz, en `http://127.0.0.1:5173`. Swagger: `/api/v1/docs`; salud: `/api/v1/health`. `-FrontendPort` cambia el puerto de Vite; `-NoReload` desactiva la recarga del backend. `-Check` usa los datos configurados: para una comprobación aislada, establecer previamente `DATABASE_URL`, `UPLOAD_DIR` y `GENERATED_DIR` a rutas temporales.

## Respaldos y experimento

```powershell
.\scripts\backup.ps1
.\scripts\backup.ps1 -Destination 'D:\ruta\para\respaldos'
.\scripts\experiment.ps1
```

El respaldo lee la base y las carpetas realmente configuradas. Utiliza la API de respaldo SQLite, que incluye datos confirmados en WAL, y copia tanto `uploads` como `generated`. Crea una carpeta nueva con fecha UTC e identificador; conserva respaldos previos. `manifest.json` con `status=complete` identifica una copia terminada. Si falta la base, falla sin crear una base vacía. Si la operación se interrumpe después de crear la carpeta, esta puede quedar incompleta y sin ese manifiesto. Para una copia coherente también de los archivos, detener la aplicación antes de respaldar.

`experiment.ps1` requiere una base migrada y un administrador; utiliza el servicio existente para generar el corpus sintético. No inventa ni registra tiempos de investigación: estos se miden desde `/tesis`.

Los respaldos, bases, documentos locales, logs, cachés y resultados de navegador están excluidos de Git. Los generadores antiguos se conservan como texto en [docs/archive/bootstrap](archive/bootstrap/README.md), fuera del procedimiento operativo. La [referencia inicial](testing/BASELINE_ESTRUCTURAL.md) describe las comprobaciones previas y sus límites.
