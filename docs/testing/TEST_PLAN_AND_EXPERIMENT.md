# PLAN MAESTRO DE PRUEBAS DE SOFTWARE Y PROTOCOLO EXPERIMENTAL
**Sistema de Borradores de Escrituras Públicas en Python**  
**Facultad de Ingeniería en Sistemas - UMG**

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
  3. *Importador de Archivos:* Carga de archivos XLSX y CSV con transacciones reversibles ante fallos.

### 2.3 Pruebas de Generación e Integridad DOCX
* Toda generación de documento debe superar obligatoriamente la prueba de auditoría física:
  1. El archivo se genera en la ruta de destino.
  2. El archivo posee estructura válida de OpenXML (.docx).
  3. Al ser inspeccionado con `python-docx`, **no contiene ninguna subcadena con llaves dobles `{{`**.
  4. Los datos inyectados coinciden exactamente con los registros del expediente.

### 2.4 Pruebas End-to-End (E2E) con Playwright
* Automatización del flujo principal en navegador Chromium:
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
* **Corpus de Prueba:** 100 expedientes sintéticos generados mediante el script `seed_synthetic.py`.
* **Distribución de Casos:**
  * 20 expedientes de Compraventa de Bien Inmueble.
  * 20 expedientes de Donación entre Vivos.
  * 20 expedientes de Arrendamiento.
  * 20 expedientes de Protocolación de Matrimonio.
  * 20 expedientes de Constitución de Sociedad.

### 3.2 Inyección Controlada de Inconsistencias
De los 100 casos, exactamente **50 casos contendrán anomalías deliberadas** para evaluar la sensibilidad del motor de reglas:
* 10 casos con discrepancia en DPI del compareciente frente al expediente.
* 10 casos con NIT inválido o inexistente.
* 10 casos con inconsistencia en datos registrales (Finca, Folio o Libro erróneos).
* 10 casos con desorden, duplicidad o ausencia de cláusulas/incisos obligatorios.
* 10 casos con discrepancia entre montos en cifras y su redacción en letras.
* Los **50 casos restantes serán completamente íntegros**.

### 3.3 Procedimiento de Medición Cronometrada
1. El evaluador inicia la sesión de prueba en el módulo de tesis (`/api/v1/experiment/start`).
2. El sistema inicia el temporizador de alta precisión (`started_at`).
3. El revisor utiliza el sistema para auditar el expediente y resolver las alertas del panel.
4. Una vez corregido y generado el borrador conforme, se finaliza la prueba (`finished_at`).
5. El sistema calcula la duración neta en minutos y segundos:
   $$\text{Duración (min)} = \frac{\text{finished\_at} - \text{started\_at}}{60}$$
6. Se almacena el registro en `time_measurements` vinculando los errores detectados y omitidos.

### 3.4 Análisis Estadístico y Contraste de Hipótesis
* **Cálculo del Porcentaje de Reducción:**
  $$\text{Reducción (\%)} = \left(\frac{\mu_{\text{tradicional}} - \mu_{\text{sistema}}}{\mu_{\text{tradicional}}}\right) \times 100$$
* **Prueba de Significancia Estadística:**
  * Evaluación de normalidad de la distribución de tiempos mediante la prueba de **Shapiro-Wilk**.
  * Si la distribución es normal: aplicación de la prueba **t de Student para muestras pareadas** con nivel de significancia $\alpha = 0.05$.
  * Si la distribución no es normal: aplicación de la prueba de rangos con signo de **Wilcoxon**.
  * **Criterio de Decisión:** Si $p\text{-valor} < 0.05$, se rechaza la hipótesis nula ($H_0$) y se acepta la hipótesis de investigación ($H_1$), confirmando que el sistema reduce significativamente el tiempo de revisión.
* **Exportación de Resultados:** Los datos se exportan automáticamente en formato `.xlsx` y `.csv` para su inclusión directa en las tablas y figuras del Capítulo IV de la tesis.
