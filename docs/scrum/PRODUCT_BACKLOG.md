# PRODUCT BACKLOG: SISTEMA DE BORRADORES DE ESCRITURAS PÚBLICAS
**Proyecto de Graduación - Universidad Mariano Gálvez de Guatemala**  
**Investigador:** Marco Antonio Lares Tohom  
**Metodología:** Scrum / Agile adaptado a Investigación Aplicada en Ingeniería de Software

---

## 1. Estructura de Épicas (Epics)

| ID Épica | Nombre de la Épica | Fase Asociada | Prioridad MoSCoW | Story Points Estimados |
|:---|:---|:---|:---:|:---:|
| **EPIC-01** | Fundación Arquitectónica, Entorno y CI Local | Fase 1 | Must Have | 13 |
| **EPIC-02** | Seguridad, Autenticación y Control de Accesos (RBAC) | Fase 2 | Must Have | 13 |
| **EPIC-03** | Gestión de Sujetos de Derecho y Expedientes Notariales | Fase 3 | Must Have | 21 |
| **EPIC-04** | Motor Dinámico de Campos Tipados y Formularios | Fase 4 | Must Have | 34 |
| **EPIC-05** | Repositorio y Versionamiento Inmutable de Plantillas DOCX | Fase 5 | Must Have | 21 |
| **EPIC-06** | Motor de Validación Documental y Reglas Notariales | Fase 6 | Must Have | 34 |
| **EPIC-07** | Motor de Generación y Verificación de Borradores DOCX | Fase 7 | Must Have | 21 |
| **EPIC-08** | Ingesta, Extracción y Mapeo Masivo de Archivos | Fase 8 | Should Have | 21 |
| **EPIC-09** | Gestión Administrativa y Financiera Auxiliar | Fase 9 | Could Have | 21 |
| **EPIC-10** | Suite de Pruebas Automatizadas y Aseguramiento de Calidad | Fase 10 | Must Have | 21 |
| **EPIC-11** | Módulo de Medición Científica y Validación de Hipótesis | Fase 11 | Must Have | 34 |
| **Total** | | | | **254 pts** |

---

## 2. Detalle de Historias de Usuario por Épica

### EPIC-01: Fundación Arquitectónica, Entorno y CI Local
* **US-01.1: Inicialización del Repositorio y Monolito Modular Backend/Frontend**
  * *Como* desarrollador del proyecto,
  * *Quiero* configurar la estructura de carpetas monolítica modular para backend (FastAPI) y frontend (React/Vite/TS),
  * *Para* tener una base arquitectónica limpia, desacoplada y ejecutable en Windows 10/11.
  * **Criterios de Aceptación:**
    1. Backend ejecuta en puerto 8000 con FastAPI y expone endpoint `/health` y documentación OpenAPI `/docs`.
    2. Frontend compila y ejecuta en Vite con React 18, TypeScript y Tailwind CSS configurado.
    3. SQLite configurado con SQLAlchemy 2.0 y base de datos local `app.db`.
    4. Alembic inicializado con script de migración base funcional.
  * *Puntos:* 5 | *Prioridad:* Must Have

* **US-01.2: Automatización de Scripts de Soporte en Windows PowerShell**
  * *Como* desarrollador y evaluador,
  * *Quiero* disponer de scripts PowerShell (`dev.ps1`, `test.ps1`, `seed.ps1`, `backup.ps1`),
  * *Para* levantar el entorno, correr pruebas, poblar datos y respaldar la base de datos sin comandos manuales complejos.
  * **Criterios de Aceptación:**
    1. `scripts/dev.ps1` arranca concurrentemente backend y frontend.
    2. `scripts/test.ps1` ejecuta `pytest` y `npm test`.
    3. `scripts/backup.ps1` copia la base de datos y adjuntos a una carpeta versionada por fecha.
  * *Puntos:* 3 | *Prioridad:* Must Have

* **US-01.3: Documentación Inicial y Configuración de Calidad de Código**
  * *Como* evaluador de calidad de software,
  * *Quiero* contar con Ruff, ESLint y Prettier preconfigurados junto a `.env.example`,
  * *Para* garantizar que el código se mantenga formateado, estandarizado y libre de secretos en el control de versiones.
  * **Criterios de Aceptación:**
    1. Configuración de Ruff ejecutando en backend sin advertencias críticas.
    2. ESLint configurado en frontend sin errores de tipado estricto.
    3. `.env.example` incluye todas las variables de entorno sin contraseñas reales.
  * *Puntos:* 5 | *Prioridad:* Must Have

---

### EPIC-02: Seguridad, Autenticación y Control de Accesos (RBAC)
* **US-02.1: Modelo de Usuarios y Hashing Seguro de Contraseñas con Argon2**
  * *Como* administrador del sistema,
  * *Quiero* gestionar usuarios con contraseñas cifradas mediante Argon2,
  * *Para* proteger las credenciales contra ataques de fuerza bruta y diccionario.
  * **Criterios de Aceptación:**
    1. Modelo de base de datos `users` con campos obligatorios y estado activo/inactivo.
    2. Ninguna contraseña se almacena ni se devuelve en texto plano.
    3. Endpoints protegidos para CRUD de usuarios.
  * *Puntos:* 5 | *Prioridad:* Must Have

* **US-02.2: Autenticación JWT y Roles de Sistema**
  * *Como* usuario del bufete (Notario, Auxiliar, Administrador),
  * *Quiero* autenticarme con credenciales válidas y recibir un token JWT con expiración,
  * *Para* acceder a los módulos de acuerdo a mi rol (`ADMINISTRADOR`, `ABOGADO_NOTARIO`, `AUXILIAR`, `ADMINISTRACION`).
  * **Criterios de Aceptación:**
    1. Endpoint `/api/v1/auth/login` retorna token JWT firmado con expiración.
    2. Middleware y dependencias de FastAPI restringen endpoints según permisos del rol.
    3. Frontend almacena de forma segura la sesión y protege las rutas privadas.
  * *Puntos:* 5 | *Prioridad:* Must Have

* **US-02.3: Registro de Auditoría de Operaciones Críticas**
  * *Como* notario responsable,
  * *Quiero* que se registren automáticamente los accesos, modificaciones, validaciones y descargas de escrituras,
  * *Para* mantener la trazabilidad jurídica sin exponer datos sensibles en los logs.
  * **Criterios de Aceptación:**
    1. Tabla `audit_logs` con `usuario_id`, `accion`, `modulo`, `registro_id`, `timestamp` y `resultado`.
    2. Prohibido registrar DPIs, contraseñas o tokens en el texto de los logs.
  * *Puntos:* 3 | *Prioridad:* Must Have

---

### EPIC-03: Gestión de Sujetos de Derecho y Expedientes Notariales
* **US-03.1: Registro y Búsqueda de Personas Individuales**
  * *Como* auxiliar o notario,
  * *Quiero* registrar y consultar personas individuales con sus datos notariales (DPI, NIT, estado civil, profesión, nacionalidad, dirección),
  * *Para* reutilizar su información en múltiples instrumentos sin transcribir manualmente.
  * **Criterios de Aceptación:**
    1. DPI y NIT se almacenan estrictamente como texto (`string`).
    2. Validación de DPI guatemalteco (13 caracteres numéricos).
    3. Normalización automática de espacios y conservación de tildes y mayúsculas en nombres.
    4. Búsqueda rápida por nombre, DPI o NIT con paginación.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-03.2: Registro de Personas Jurídicas y Representación Legal**
  * *Como* notario,
  * *Quiero* registrar sociedades mercantiles, asociaciones y entidades con sus datos de inscripción registral y representante legal,
  * *Para* otorgar escrituras donde intervengan personas morales.
  * **Criterios de Aceptación:**
    1. Registro de Razón Social, Nombre Comercial, NIT, Tipo de Sociedad, No. Registro, Folio, Libro de Sociedades.
    2. Vinculación relacional con la persona individual que ostenta la representación legal y cargo.
  * *Puntos:* 5 | *Prioridad:* Must Have

* **US-03.3: Gestión Integral de Expedientes Notariales**
  * *Como* notario,
  * *Quiero* aperturar un expediente asignándole cliente principal, tipo de operación, estado y participantes,
  * *Para* centralizar toda la documentación, borradores y finanzas de un caso notarial.
  * **Criterios de Aceptación:**
    1. Generación de código único de expediente (`EXP-YYYY-#####`).
    2. Estados: `ABIERTO`, `EN_REVISION`, `PENDIENTE`, `FINALIZADO`, `CANCELADO`.
    3. Asociación múltiple de partes comparecientes (compradores, vendedores, donantes, testigos).
  * *Puntos:* 8 | *Prioridad:* Must Have

---

### EPIC-04: Motor Dinámico de Campos Tipados y Formularios
* **US-04.1: Modelo y Definición de Campos de Plantilla (Template Fields)**
  * *Como* administrador o notario,
  * *Quiero* configurar campos dinámicos tipados asociados a cada versión de plantilla,
  * *Para* que el sistema valide y recolecte exactamente la información requerida por cada tipo de escritura.
  * **Criterios de Aceptación:**
    1. Tabla `template_fields` soportando los 20 tipos obligatorios (`text`, `name`, `dpi`, `nit`, `phone`, `email`, `currency`, `date`, `relation`, `list`, `computed`, etc.).
    2. Configuración de restricciones: `required`, `regex`, `min_value`, `max_value`, `docx_variable`.
  * *Puntos:* 13 | *Prioridad:* Must Have

* **US-04.2: Componente DynamicForm Universal en Frontend**
  * *Como* usuario que redacta una escritura,
  * *Quiero* una interfaz que renderice dinámicamente controles según el tipo de campo (`DpiInput`, `CurrencyInput`, `RelationInput`, `ListInput`),
  * *Para* ingresar datos con validación visual inmediata, máscaras y autocompletado.
  * **Criterios de Aceptación:**
    1. Validación del lado del cliente mediante Zod + React Hook Form sincronizado con las reglas backend.
    2. `CurrencyInput` formatea a Quetzales (`Q`) con dos decimales y procesa montos en precisión fija.
    3. `ListInput` permite agregar, editar, reordenar y eliminar elementos dinámicos (comparecientes, bienes).
  * *Puntos:* 13 | *Prioridad:* Must Have

* **US-04.3: Campos Calculados y Relacionales**
  * *Como* notario,
  * *Quiero* que al seleccionar un cliente se autocompleten sus datos personales y se calculen subtotales o porcentajes automáticamente,
  * *Para* evitar discrepancias aritméticas y duplicidad de esfuerzo.
  * **Criterios de Aceptación:**
    1. El campo `relation` autocompleta DPI, NIT, dirección y estado civil desde la base de datos de clientes.
    2. Los campos `computed` son de solo lectura y se recalculan al modificar los campos fuente.
  * *Puntos:* 8 | *Prioridad:* Must Have

---

### EPIC-05: Repositorio y Versionamiento Inmutable de Plantillas DOCX
* **US-05.1: Carga, Validación e Ingesta de Plantillas DOCX**
  * *Como* notario administrador,
  * *Quiero* subir archivos `.docx` con marcadores Jinja2 (`{{ variable }}`),
  * *Para* crear plantillas base de escrituras en el sistema.
  * **Criterios de Aceptación:**
    1. Validación estricta de formato DOCX y almacenamiento seguro con UUID en `backend/uploads/templates/`.
    2. Creación de versión inicial inmutable en `template_versions`.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-05.2: Extractor Léxico de Variables Jinja2**
  * *Como* notario,
  * *Quiero* que el sistema analice automáticamente el contenido del DOCX y detecte todas las variables `{{ ... }}`, bucles `{% for %}` y condicionales,
  * *Para* mapearlas automáticamente contra los campos tipados del formulario.
  * **Criterios de Aceptación:**
    1. Detección exhaustiva de variables en párrafos y tablas del documento.
    2. Interfaz visual para confirmar el mapeo entre variables de plantilla y campos del modelo.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-05.3: Versionamiento Inmutable y Activación de Plantillas**
  * *Como* notario,
  * *Quiero* mantener un historial de versiones (`v1`, `v2`, etc.) de cada plantilla sin sobrescribir las anteriores,
  * *Para* garantizar la reproducibilidad jurídica de borradores emitidos en el pasado.
  * **Criterios de Aceptación:**
    1. Solo una versión puede estar en estado `ACTIVA` por tipo de plantilla.
    2. Las versiones previas se conservan en modo solo lectura.
  * *Puntos:* 5 | *Prioridad:* Must Have

---

### EPIC-06: Motor de Validación Documental y Reglas Notariales
* **US-06.1: Motor de Reglas Sintácticas y Estructurales (RULE-001 a RULE-003)**
  * *Como* operador del sistema,
  * *Quiero* que el motor valide la completitud de campos obligatorios y la sintaxis de identificadores guatemaltecos,
  * *Para* impedir la generación de borradores con vacíos estructurales.
  * **Criterios de Aceptación:**
    1. RULE-001: Valida campos obligatorios según la plantilla.
    2. RULE-002: Formato exacto de 13 dígitos numéricos en DPI.
    3. RULE-003: Formato válido de NIT guatemalteco con guion o corrido.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-06.2: Reglas de Consistencia Notarial y Cruzada (RULE-004 a RULE-013)**
  * *Como* notario,
  * *Quiero* que el motor compare los datos del documento contra la ficha del cliente y los antecedentes del expediente,
  * *Para* detectar contradicciones en nombres, DPI, fincas/folios/libros y montos.
  * **Criterios de Aceptación:**
    1. RULE-004/005/006: Comprobación de concordancia de DPI, NIT y nombres entre comparecencia y registro maestro.
    2. RULE-008: Concordancia entre montos en cifras y su expresión notarial en letras.
    3. RULE-009 a RULE-013: Coherencia de datos registrales de la propiedad (finca, folio, libro y departamento).
  * *Puntos:* 13 | *Prioridad:* Must Have

* **US-06.3: Integridad de Cláusulas y Panel de Inconsistencias Interactivo (RULE-014 a RULE-020)**
  * *Como* usuario que revisa un borrador,
  * *Quiero* ver un panel clasificado por severidad (`CRITICAL`, `ERROR`, `WARNING`) con acceso directo al campo erróneo,
  * *Para* corregir las discrepancias antes de la firma.
  * **Criterios de Aceptación:**
    1. RULE-014 a RULE-016: Detección de incisos omitidos, duplicados o con salto de numeración.
    2. RULE-017: Detección de variables Jinja2 no sustituidas.
    3. Interfaz con botón "Ir al campo" para ubicar el foco de edición inmediatamente.
  * *Puntos:* 13 | *Prioridad:* Must Have

---

### EPIC-07: Motor de Generación y Verificación de Borradores DOCX
* **US-07.1: Servicio de Renderizado con docxtpl**
  * *Como* notario,
  * *Quiero* generar el borrador en formato `.docx` a partir de los datos validados del expediente y la plantilla activa,
  * *Para* obtener un instrumento listo para impresión en hojas de protocolo o revisión final.
  * **Criterios de Aceptación:**
    1. Renderizado ejecutado estrictamente en backend mediante `docxtpl.DocxTemplate`.
    2. Sustitución correcta de comparecientes múltiples, cláusulas condicionales y tablas.
    3. Almacenamiento seguro en `backend/generated/` con registro en `document_versions`.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-07.2: Verificación Post-Generación de Cero Placeholders Residuales**
  * *Como* notario responsable de la fe pública,
  * *Quiero* que el sistema certifique que no queda ninguna variable `{{ ... }}` sin reemplazar en el archivo generado,
  * *Para* asegurar la integridad formal del instrumento antes de descargarlo.
  * **Criterios de Aceptación:**
    1. Inspección automatizada con `python-docx` en todos los párrafos y celdas del archivo.
    2. Si se detecta un patrón `{{`, la versión se marca con estado `ERROR_PLACEHOLDERS_PENDIENTES` y se alerta al usuario.
    3. Registro de hash SHA-256 del documento generado para garantizar trazabilidad.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-07.3: Historial y Descarga de Versiones de Borradores**
  * *Como* usuario del despacho,
  * *Quiero* consultar el historial de borradores generados para un expediente y descargar versiones previas,
  * *Para* contrastar cambios entre diferentes rondas de revisión.
  * **Criterios de Aceptación:**
    1. Listado ordenado por fecha con autor, notas de versión y estado de validación.
    2. Descarga autenticada a través de la API.
  * *Puntos:* 5 | *Prioridad:* Must Have

---

### EPIC-08: Ingesta, Extracción y Mapeo Masivo de Archivos
* **US-08.1: Importación de Clientes y Datos desde XLSX y CSV**
  * *Como* auxiliar del bufete,
  * *Quiero* subir hojas de cálculo con datos de clientes o inmuebles y mapear sus columnas,
  * *Para* poblar expedientes sin digitar registro por registro.
  * **Criterios de Aceptación:**
    1. Detección automática de columnas y vista previa de los primeros 10 registros.
    2. Interfaz de mapeo de columnas hacia los atributos del sistema.
    3. Validación y carga atómica con reporte de errores por fila y celda.
  * *Puntos:* 13 | *Prioridad:* Should Have

* **US-08.2: Extracción de Texto en PDFs Digitales Nativos**
  * *Como* notario,
  * *Quiero* adjuntar certificaciones registrales en PDF digital y extraer su texto mediante `pypdf`,
  * *Para* facilitar la copia de linderos o datos de inscripción al expediente.
  * **Criterios de Aceptación:**
    1. Extracción de texto de PDFs con capa digital válida.
    2. Si el documento es un PDF escaneado sin texto, marcarlo claramente como `EXTRACCION_NO_DISPONIBLE_SIN_OCR` sin fallar la aplicación.
  * *Puntos:* 8 | *Prioridad:* Should Have

---

### EPIC-09: Gestión Administrativa y Financiera Auxiliar
* **US-09.1: Generación de Cotizaciones Notariales**
  * *Como* administrador del bufete,
  * *Quiero* emitir cotizaciones asociadas a expedientes con detalle de aranceles, timbres, impuestos y honorarios,
  * *Para* formalizar la propuesta económica a los otorgantes.
  * **Criterios de Aceptación:**
    1. Cabecera y detalle de cotización con cálculo de subtotales, descuentos y total con `Decimal`.
    2. Estados: `BORRADOR`, `ENVIADA`, `ACEPTADA`, `RECHAZADA`, `VENCIDA`.
  * *Puntos:* 8 | *Prioridad:* Could Have

* **US-09.2: Presupuestos, Control de Cobros y Pagos**
  * *Como* auxiliar contable,
  * *Quiero* registrar cobros y recepcionar pagos asociados a un expediente,
  * *Para* conocer el saldo insoluto en tiempo real.
  * **Criterios de Aceptación:**
    1. Recálculo automático: `Saldo = Monto Cobro - Suma(Pagos)`.
    2. Estados automáticos de cobro (`PENDIENTE`, `PARCIAL`, `PAGADO`).
    3. Manejo monetario en Quetzales o Dólares exclusivamente con precisión fija.
  * *Puntos:* 13 | *Prioridad:* Could Have

---

### EPIC-10: Suite de Pruebas Automatizadas y Aseguramiento de Calidad
* **US-10.1: Batería de Pruebas Unitarias Backend y Reglas de Negocio**
  * *Como* ingeniero QA,
  * *Quiero* una suite exhaustiva de pruebas unitarias con `pytest`,
  * *Para* garantizar que todos los validadores, tipos de campos y reglas RULE-001..020 funcionen sin fallos.
  * **Criterios de Aceptación:**
    1. Cobertura de pruebas unitarias superior al 85% en módulos de validación y modelos.
    2. Pruebas de casos borde en formato de DPI, NIT, montos negativos y divisiones entre cero.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-10.2: Pruebas de Integración de Flujo Completo API**
  * *Como* desarrollador backend,
  * *Quiero* pruebas de integración que evalúen la interacción entre base de datos SQLite, endpoints y servicios,
  * *Para* verificar que las transacciones y la persistencia sean consistentes.
  * **Criterios de Aceptación:**
    1. Pruebas de integración con `httpx` ejecutadas en base de datos SQLite aislada en memoria o fixture temporal.
    2. Pruebas de ciclo completo: crear cliente -> abrir expediente -> validar datos -> generar DOCX.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-10.3: Pruebas de Interfaz de Usuario y E2E**
  * *Como* evaluador del sistema,
  * *Quiero* pruebas E2E con Chromium (Playwright),
  * *Para* asegurar que un usuario pueda autenticarse, completar formularios y corregir inconsistencias interactivamente.
  * **Criterios de Aceptación:**
    1. Flujo E2E automatizado de inicio a fin verificado en Windows.
  * *Puntos:* 5 | *Prioridad:* Must Have

---

### EPIC-11: Módulo de Medición Científica y Validación de Hipótesis
* **US-11.1: Generador de 100 Casos Sintéticos Estratificados**
  * *Como* tesista e investigador UMG,
  * *Quiero* generar automáticamente 100 expedientes de prueba con datos sintéticos realistas,
  * *Para* disponer del corpus experimental requerido por la muestra estadística de la tesis.
  * **Criterios de Aceptación:**
    1. Exactamente 20 casos de Compraventa, 20 Donaciones, 20 Arrendamientos, 20 Matrimonios y 20 Sociedades.
    2. 50% de casos con inconsistencias deliberadas controladas y 50% de casos íntegros.
    3. Ningún dato personal real; generación 100% sintética con localización en español.
  * *Puntos:* 13 | *Prioridad:* Must Have

* **US-11.2: Cronómetro de Revisión y Registro Comparativo de Mediciones**
  * *Como* evaluador experimental,
  * *Quiero* registrar los tiempos de revisión y corrección bajo el método tradicional vs. el método asistido por el sistema,
  * *Para* obtener la muestra cuantitativa de tiempos en minutos y segundos.
  * **Criterios de Aceptación:**
    1. Tablas `test_cases`, `test_executions` y `time_measurements`.
    2. Registro de duración, errores detectados y correcciones realizadas.
  * *Puntos:* 8 | *Prioridad:* Must Have

* **US-11.3: Dashboard Experimental y Cálculo Estadístico de Reducción Temporal**
  * *Como* tesista,
  * *Quiero* que el sistema calcule el porcentaje real de reducción temporal y presente métricas comparativas dinámicas,
  * *Para* sustentar empíricamente la comprobación de la hipótesis en la defensa de tesis.
  * **Criterios de Aceptación:**
    1. Cálculo en tiempo real de la fórmula oficial: `((T_tradicional - T_sistema) / T_tradicional) * 100`.
    2. Gráficas de caja y bigotes / distribución temporal y tasa de inconsistencias detectadas.
    3. Exportación de datos a Excel/CSV para procesar en SPSS o R en el Capítulo IV de la tesis.
  * *Puntos:* 13 | *Prioridad:* Must Have
