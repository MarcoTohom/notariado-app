# PLAN MAESTRO DE PRUEBAS DE SOFTWARE Y PROTOCOLO EXPERIMENTAL
**Sistema de Borradores de Escrituras Públicas en Python**  
**Facultad de Ingeniería en Sistemas - UMG**

> **Alcance:** estrategia de QA y protocolo académico de evaluación. La cobertura ejecutada se registra en los informes de [fase 0](BASELINE_ESTRUCTURAL.md) y [fase 1](FASE_1_ESTRUCTURAL.md). La meta de 240 a 60 minutos requiere mediciones del experimento; las pruebas de software no demuestran esa reducción. [Índice documental](../README.md) · [Mapa de módulos](../modules.md).

---

## 1. Estrategia General de Aseguramiento de Calidad (QA)

El aseguramiento de calidad del sistema abarca dos vertientes complementarias:
1. **Pruebas de Ingeniería de Software:** Verificación del correcto funcionamiento técnico, integridad referencial, seguridad y ausencia de fallos en el código.
2. **Pruebas de Investigación Científica (Experimento):** Medición estadística formal con 100 casos sintéticos para evaluar la reducción del tiempo de revisión frente a la línea base tradicional.

```text
               ┌──────────────────────────────────────────────┐
               │         EXPERIMENTO DE TESIS (N=100)         │
               │   Medición formal de tiempos y reducción %   │
               └──────────────────────┬───────────────────────┘
                                      │
               ┌──────────────────────▼───────────────────────┐
               │             PRUEBAS E2E (Playwright)         │
               │     Flujo de usuario completo en navegador   │
               └──────────────────────┬───────────────────────┘
                                      │
               ┌──────────────────────▼───────────────────────┐
               │         PRUEBAS DE INTEGRACIÓN (FastAPI)     │
               │      Endpoints, SQLAlchemy, SQLite, DOCX     │
               └──────────────────────┬───────────────────────┘
                                      │
               ┌──────────────────────▼───────────────────────┐
               │           PRUEBAS UNITARIAS (pytest)         │
               │    Validadores Pydantic, RULE-001..RULE-020  │
               └──────────────────────────────────────────────┘
```

---

## 2. Niveles de Pruebas de Software

### 2.1 Pruebas Unitarias (Backend y Frontend)
* **Alcance Backend (`pytest`):**
  * Validadores sintácticos de DPI (13 dígitos numéricos, códigos departamentales).
  * Validadores de NIT guatemalteco (formato con guion y sin guion).
  * Manejo monetario en precisión fija (`Decimal`).
  * Normalización léxica de nombres (conservación de tildes, mayúsculas, espacios).
  * Evaluación independiente de cada regla notarial (**RULE-001 a RULE-020**).
* **Alcance Frontend (`vitest` + React Testing Library):**
  * Renderizado correcto de cada control dinámico (`DpiInput`, `CurrencyInput`, `RelationInput`).
  * Validación en tiempo real del esquema Zod del formulario.

### 2.2 Pruebas de Integración (Backend y Persistencia)
* **Entorno de Prueba:** Base de datos SQLite aislada en memoria o archivo temporal para tests.
* **Escenarios Clave:**
  1. *Ciclo de Autenticación:* Registro de usuario, hash Argon2, generación y validación de token JWT.
  2. *Gestión de Clientes y Expedientes:* Creación, búsqueda paginada y vinculación de comparecientes.
  3. *Importador de Archivos (previsto):* Carga de archivos XLSX y CSV con transacciones reversibles ante fallos. El módulo de ingesta sigue pendiente; los adjuntos actuales tienen pruebas de carga y descarga, sin importación de datos.

### 2.3 Pruebas de Generación e Integridad DOCX
* Toda generación de documento debe superar obligatoriamente la prueba de auditoría física:
  1. El archivo se genera en la ruta de destino.
  2. El archivo posee estructura válida de OpenXML (.docx).
  3. Al ser inspeccionado con `python-docx`, **no contiene ninguna subcadena con llaves dobles `{{`**.
  4. Los datos inyectados coinciden exactamente con los registros del expediente.

### 2.4 Pruebas End-to-End (E2E) con Playwright

El escenario automatizado vigente es [dynamic-fields.spec.ts](../../frontend/e2e/dynamic-fields.spec.ts): configura un formulario, captura los veinte tipos, reordena una lista, guarda, recarga y descarga un adjunto. Utiliza servicios y almacenamiento temporales con datos sintéticos. Se ejecuta desde la raíz con `scripts/test.ps1 -E2E` y pasó en la fase estructural 1.

* **Cobertura objetivo del flujo completo**, pendiente de la verificación integral del plan estructural:
  * Iniciar sesión como `notario.demo`.
  * Crear o seleccionar un expediente.
  * Diligenciar el formulario dinámico.
  * Inducir deliberadamente un DPI inconsistente.
  * Verificar que el **Panel de Inconsistencias** muestre la alerta crítica.
  * Corregir el DPI y pulsar generar borrador.
  * Confirmar descarga del archivo Word sin errores.

---

## 3. Protocolo Experimental de Tesis (Muestra N=100)

### 3.1 Diseño Metodológico
* **Diseño:** Cuasiexperimental con grupo de control histórico (Línea Base: 240 minutos) y grupo experimental asistido por el software.
* **Corpus de Prueba:** 100 expedientes sintéticos generados desde la raíz con `scripts/experiment.ps1`, o con `POST /api/v1/experiment/cases/generate`. El script requiere una base migrada y un administrador. La implementación está en [synthetic_data.py](../../backend/app/utils/synthetic_data.py) y [experiment_service.py](../../backend/app/services/experiment_service.py); generar el corpus no registra tiempos.
* **Distribución de Casos:**
  * 20 expedientes de Compraventa de Bien Inmueble.
  * 20 expedientes de Donación entre Vivos.
  * 20 expedientes de Arrendamiento.
  * 20 expedientes de Protocolación de Matrimonio.
  * 20 expedientes de Constitución de Sociedad.

### 3.2 Inyección Controlada de Inconsistencias
El generador vigente distribuye **10 casos íntegros y 10 anómalos por cada tipo de escritura**: 50 íntegros y 50 con anomalías deliberadas. `ANOMALY_PLAN` en [synthetic_data.py](../../backend/app/utils/synthetic_data.py) define diez patrones de reglas por tipo; `expected_findings` registra los hallazgos esperados, incluidos efectos asociados de otras reglas. [test_experiment_corpus.py](../../backend/tests/unit/test_experiment_corpus.py) comprueba la correspondencia del corpus con el motor.

El diseño académico original proponía esta clasificación:

- 10 casos con discrepancia en DPI del compareciente frente al expediente.
- 10 casos con NIT inválido o inexistente.
- 10 casos con inconsistencia en datos registrales (Finca, Folio o Libro erróneos).
- 10 casos con desorden, duplicidad o ausencia de cláusulas/incisos obligatorios.
- 10 casos con discrepancia entre montos en cifras y su redacción en letras.

Esa clasificación no coincide con el reparto vigente por tipo de escritura y patrón de reglas. Se conserva aquí como antecedente del diseño; cualquier ajuste metodológico requiere tratarse por separado antes del experimento formal. Esta actualización documental no cambia el generador ni el procedimiento de medición.

### 3.3 Procedimiento de Medición Cronometrada
1. El evaluador inicia la revisión desde `/tesis` mediante `POST /api/v1/experiment/executions/start`, seleccionando el caso y el método `TRADITIONAL` o `SYSTEM`.
2. El backend registra `started_at` en UTC; la interfaz muestra el tiempo transcurrido. Puede registrar etapas DETECCION, CORRECCION y GENERACION mediante las rutas de etapas del [mapa de módulos](../modules.md).
3. El revisor utiliza el sistema para auditar el expediente y resolver las alertas del panel.
4. Una vez corregido y generado el borrador conforme, se finaliza la ejecución con `POST /api/v1/experiment/executions/{execution_id}/finish` y se registra `finished_at`. En `TRADITIONAL` se ingresan los conteos manuales; en `SYSTEM` el servicio compara hallazgos con los esperados. El evaluador comprueba el cumplimiento del procedimiento antes de finalizar: el endpoint de medición no lo acredita automáticamente.
5. El sistema calcula la duración neta en minutos y segundos:
   $$\text{Duración (min)} = \frac{\text{finished\_at} - \text{started\_at}}{60}$$
6. `test_executions` almacena la duración total y los errores detectados y omitidos. `time_measurements` almacena la duración de cada etapa vinculada a la ejecución; los modelos están en [experiment.py](../../backend/app/models/experiment.py).

### 3.4 Análisis Estadístico y Contraste de Hipótesis
* **Cálculo del Porcentaje de Reducción:**
  $$\text{Reducción (\%)} = \left(\frac{\mu_{\text{tradicional}} - \mu_{\text{sistema}}}{\mu_{\text{tradicional}}}\right) \times 100$$
* **Prueba de Significancia Estadística:**
  * Evaluación de normalidad de la distribución de tiempos mediante la prueba de **Shapiro-Wilk**.
  * Si la distribución es normal: aplicación de la prueba **t de Student para muestras pareadas** con nivel de significancia $\alpha = 0.05$.
  * Si la distribución no es normal: aplicación de la prueba de rangos con signo de **Wilcoxon**.
  * **Criterio de Decisión:** Si $p\text{-valor} < 0.05$, se rechaza la hipótesis nula ($H_0$) y se acepta la hipótesis de investigación ($H_1$), confirmando que el sistema reduce significativamente el tiempo de revisión.
* **Exportación de Resultados:** El usuario solicita `.xlsx` o `.csv` desde el módulo de tesis mediante `GET /api/v1/experiment/export.xlsx` o `GET /api/v1/experiment/export.csv`, para analizar e incorporar los resultados al Capítulo IV.

Las estadísticas del módulo usan ejecuciones finalizadas. Cuando no existen mediciones tradicionales, muestran la referencia histórica configurada (240 minutos por defecto) con `baseline_source=HISTORICA`; con mediciones tradicionales, utilizan su media y `baseline_source=MEDICIONES`. Sin ejecuciones `SYSTEM`, la reducción permanece sin valor. El contraste pareado requiere al menos tres casos con ambos métodos. Estos comportamientos del software no acreditan por sí mismos la ejecución formal del experimento ni el cumplimiento de su meta.
