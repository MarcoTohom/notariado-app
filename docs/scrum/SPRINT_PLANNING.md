# SPRINT PLANNING & SEGUIMIENTO METODOLÓGICO SCRUM
**Sistema de Borradores de Escrituras Públicas en Python**  
**Proyecto de Graduación - Universidad Mariano Gálvez de Guatemala**

---

## 1. Parámetros del Proyecto y Calendario de Sprints

* **Marco Temporal:** Proyecto de Graduación 2 (Semestre Académico).
* **Duración de Cada Sprint:** 2 Semanas (10 días hábiles por Sprint).
* **Capacidad Estimada por Sprint:** ~40 a 45 Story Points (Velocity promedio).
* **Número Total de Sprints:** 6 Sprints.
* **Story Points Totales:** 254 pts.

---

## 2. Asignación de Épicas e Historias por Sprint

```
       [Sprint 1]               [Sprint 2]               [Sprint 3]
  Fundación & Seguridad    Campos Tipados & DOCX     Reglas & Generación
   (47 Story Points)         (47 Story Points)        (47 Story Points)
           │                         │                        │
           ▼                         ▼                        ▼
       [Sprint 4]               [Sprint 5]               [Sprint 6]
  Ingesta & Inconsistencias Módulo Financiero/Admin   Experimento 100 Casos
   (39 Story Points)         (34 Story Points)       & QA (40 Story Points)
```

---

### SPRINT 1: Arquitectura Base, Seguridad RBAC y Modelo de Datos Inicial
* **Objetivo del Sprint:** Disponer de la infraestructura técnica ejecutable en Windows, autenticación con Argon2/JWT y gestión de clientes y expedientes.
* **Historias de Usuario:**
  * `US-01.1`: Inicialización del Repositorio y Monolito FastAPI / React (5 pts)
  * `US-01.2`: Automatización con scripts PowerShell (`dev.ps1`, `test.ps1`, `backup.ps1`) (3 pts)
  * `US-01.3`: Linters, Ruff, TypeScript estricto y configuración `.env.example` (5 pts)
  * `US-02.1`: Modelo de usuarios y hash con Argon2 (5 pts)
  * `US-02.2`: Autenticación JWT y roles (`ADMINISTRADOR`, `ABOGADO_NOTARIO`, `AUXILIAR`, `ADMINISTRACION`) (5 pts)
  * `US-02.3`: Registro de auditoría básica (3 pts)
  * `US-03.1`: Registro y búsqueda de personas individuales (DPI texto, normalización) (8 pts)
  * `US-03.2`: Personas jurídicas y representantes legales (5 pts)
  * `US-03.3`: Apertura y control de expedientes notariales (8 pts)
* **Puntos Totales Sprint 1:** **47 pts**
* **Entregable del Sprint:** Backend y Frontend corriendo en local; inicio de sesión con roles, alta de clientes y creación de expedientes funcionales.

---

### SPRINT 2: Motor Dinámico de Campos Tipados y Repositorio de Plantillas DOCX
* **Objetivo del Sprint:** Implementar el catálogo de 20 tipos de campos dinámicos con formularios en React y el sistema de subida y versionamiento de plantillas Word.
* **Historias de Usuario:**
  * `US-04.1`: Definición de campos de plantilla en backend (13 pts)
  * `US-04.2`: Componente universal `DynamicForm` en frontend con Zod y React Hook Form (13 pts)
  * `US-05.1`: Carga e ingesta segura de plantillas DOCX con almacenamiento UUID (8 pts)
  * `US-05.2`: Extracción léxica de variables Jinja2 (`{{ ... }}`, loops y condicionales) (8 pts)
  * `US-05.3`: Versionamiento inmutable de plantillas (`v1`, `v2`, etc.) (5 pts)
* **Puntos Totales Sprint 2:** **47 pts**
* **Entregable del Sprint:** Carga de un DOCX con variables Jinja2, detección automática de variables, configuración de campos tipados y formulario dinámico renderizado en UI.

---

### SPRINT 3: Motor de Reglas Notariales y Generación Verificada de DOCX
* **Objetivo del Sprint:** Desarrollar el motor de validación de inconsistencias (RULE-001..RULE-020) y la generación física de borradores DOCX sin variables residuales.
* **Historias de Usuario:**
  * `US-04.3`: Campos calculados y relacionales (autocompletado de clientes) (8 pts)
  * `US-06.1`: Reglas sintácticas (RULE-001 requeridos, RULE-002 DPI, RULE-003 NIT) (8 pts)
  * `US-06.2`: Reglas de consistencia cruzada (RULE-004..RULE-013: nombres, montos en letras, fincas/folios/libros) (13 pts)
  * `US-07.1`: Servicio de renderizado DOCX con `docxtpl` en backend (8 pts)
  * `US-07.2`: Verificación automatizada con `python-docx` de cero placeholders residuales (8 pts)
  * `US-07.3`: Historial inmutable y descarga de borradores (5 pts)
* **Puntos Totales Sprint 3:** **50 pts**
* **Entregable del Sprint:** Flujo E2E núcleo: Llenado de formulario -> Validación de reglas notariales -> Generación de DOCX verificado y descargable.

---

### SPRINT 4: Ingesta de Archivos, Extracción PDF y Panel de Inconsistencias
* **Objetivo del Sprint:** Incorporar la importación masiva de datos (XLSX, CSV) y el panel visual interactivo de errores notariales con redirección al campo.
* **Historias de Usuario:**
  * `US-06.3`: Integridad de cláusulas/incisos (RULE-014..RULE-020) y Panel de Inconsistencias interactivo (13 pts)
  * `US-08.1`: Importación atómica y mapeo de columnas desde XLSX y CSV (13 pts)
  * `US-08.2`: Extracción de texto de documentos PDF digitales nativos con `pypdf` (8 pts)
  * `US-10.1`: Batería de pruebas unitarias de validación y campos de borde (5 pts)
* **Puntos Totales Sprint 4:** **39 pts**
* **Entregable del Sprint:** Capacidad de importar clientes desde Excel, adjuntar PDFs registrales legibles y panel interactivo con botones "Ir al campo" para corregir inconsistencias.

---

### SPRINT 5: Gestión Financiera Auxiliar, Auditoría Avanzada y Dashboard
* **Objetivo del Sprint:** Implementar el módulo administrativo auxiliar para cobros, pagos, cotizaciones y el panel de control del bufete.
* **Historias de Usuario:**
  * `US-09.1`: Generación de cotizaciones notariales con precisión `Decimal` (8 pts)
  * `US-09.2`: Presupuestos, control de cobros, recepciones de pagos y saldo en tiempo real (13 pts)
  * `US-10.2`: Pruebas de integración del flujo de la API y persistencia SQLite (8 pts)
  * `US-10.3`: Pruebas de interfaz y navegación frontend (5 pts)
* **Puntos Totales Sprint 5:** **34 pts**
* **Entregable del Sprint:** Módulo administrativo operativo; cálculo exacto de ingresos, honorarios y saldos; cobertura de integración ejecutándose en local.

---

### SPRINT 6: Muestra Experimental de Tesis (100 Casos), QA Integral y Cierre
* **Objetivo del Sprint:** Generar los 100 casos sintéticos, ejecutar la prueba experimental de comparación de tiempos, verificar hipótesis y generar documentación final.
* **Historias de Usuario:**
  * `US-11.1`: Generador de 100 casos sintéticos distribuidos (20 casos x 5 tipos de escrituras) (13 pts)
  * `US-11.2`: Cronómetro de medición experimental (método tradicional vs. asistido) (8 pts)
  * `US-11.3`: Dashboard experimental dinámico, cálculo de porcentaje de reducción y exportación para tesis (13 pts)
  * Verificación integral E2E, ejecución de suite completa (`pytest`, `npm test`, `playwright`) y cierre de documentación (6 pts)
* **Puntos Totales Sprint 6:** **40 pts**
* **Entregable del Sprint:** Sistema 100% terminado; módulo experimental ejecutado con los 100 casos; reporte de métricas cuantitativas listo para sustentar el Capítulo IV de la tesis.

---

## 3. Ceremonias y Seguimiento Metodológico

1. **Sprint Planning:**
   * Al inicio de cada sprint, se seleccionan las historias de usuario según prioridad.
   * Se revisan los criterios de aceptación y se desglosan tareas técnicas de backend, frontend y pruebas.
2. **Daily Standup (Registro Asistido):**
   * *¿Qué se avanzó en la sesión anterior?*
   * *¿Qué se implementará en la sesión actual?*
   * *¿Existen impedimentos técnicos o dudas legales registrales?*
3. **Sprint Review & Demo:**
   * Demostración en vivo del software funcionando en Windows (sin presentaciones conceptuales vacías).
   * Verificación física de la base de datos SQLite y archivos `.docx` generados.
4. **Sprint Retrospective:**
   * Análisis de la velocidad del sprint y ajustes en la complejidad de los componentes dinámicos.
