# DOCUMENTO EJECUTIVO DE PRESENTACIÓN Y DEFENSA DE TESIS
**Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación**  
**Universidad Mariano Gálvez de Guatemala (UMG)**

---

## Ficha Técnica del Proyecto de Graduación

* **Título Definitivo:** *Desarrollo de un sistema de borradores de escrituras públicas en Python para reducir el tiempo de redacción y revisión de consistencias en los datos y congruencia en los incisos en un bufete jurídico.*
* **Investigador / Tesista:** Marco Antonio Lares Tohom
* **Asesor Metodológico / Terna:** Terna Evaluadora de Proyectos de Graduación UMG
* **Grado Académico:** Ingeniero en Sistemas de Información y Ciencias de la Computación
* **Ubicación de Aplicación:** Bufete Jurídico en la Ciudad de Guatemala

---

## 1. Resumen Ejecutivo (Abstract)

En el ejercicio notarial guatemalteco, la elaboración de instrumentos matrices en el protocolo requiere de un rigor formal y material extremo derivado de la fe pública delegada por el Estado. La práctica tradicional predominante en los despachos jurídicos recurre a la redacción por analogía o reutilización manual de archivos de texto previos (técnica de "copiar y pegar"), lo que carece de mecanismos automatizados de validación cruzada. Esta metodología artesanal genera una tasa crítica de inconsistencias humanas (discrepancias en números de DPI, NIT, nombres de otorgantes, numeración de cláusulas e incisos y datos registrales de bienes inmuebles), obligando a invertir una **línea base promedio de 240 minutos (4 horas)** en revisiones manuales por instrumento público.

El presente proyecto de graduación diseña, implementa y valida experimentalmente una solución tecnológica basada en un **monolito modular en Python y TypeScript**, compuesto por un motor de campos dinámicos tipados, un repositorio inmutable de plantillas DOCX con renderizado Jinja2 y un **motor de reglas de validación notarial (RULE-001 a RULE-020)**. El objetivo científico central es contrastar la hipótesis de investigación: evaluar si la estandarización y validación automatizada permite reducir el tiempo de revisión documental hasta una **meta experimental de 60 minutos (1 hora)**, demostrando su efectividad mediante una muestra estratificada de **100 casos sintéticos controlados** sin incurrir en costos de licenciamiento para el bufete jurídico.

---

## 2. Planteamiento y Justificación de la Investigación

### 2.1 El Problema Operativo y Jurídico
1. **Riesgos de Nulidad y Responsabilidad Civil/Penal:** El Código de Notariado (Decreto 314) sanciona con severidad los vicios de forma y fondo. Un dígito transpuesto en el Código Único de Identificación (DPI) o un error en los identificadores registrales (Finca, Folio, Libro) acarrea el rechazo del testimonio en el Registro General de la Propiedad (RGP) o impugnaciones de nulidad instrumental.
2. **Incongruencia Estructural:** La duplicidad de incisos, saltos en la numeración de cláusulas y la permanencia de datos del cliente del caso anterior son los errores más comunes derivados del copiado manual.
3. **Cuello de Botella Temporal:** La revisión manual exige leer minuciosamente 4 a 10 páginas de texto legal repetitivo para verificar cifras en letras y datos cruzados, postergando la entrega final a los clientes.

### 2.2 Justificación Multidimensional
* **Pilar Teórico-Científico:** Aporta a la ingeniería de software aplicada la formalización de un motor de reglas semánticas adaptado a la lógica jurídica formal del notariado latino.
* **Pilar Legal:** 
  * Se sustenta en el **Artículo 4° del Reglamento de Trabajo de Graduación (1988)** de la UMG.
  * Garantiza el cumplimiento del **Artículo 31 de la Constitución Política de la República de Guatemala (Habeas Data)** mediante el aislamiento local de los datos y políticas de auditoría estricta.
  * Opera conforme a las formalidades imperativas del **Código de Notariado (Decreto 314)**.
* **Pilar Económico:** Implementado 100% sobre tecnologías de código abierto (Open Source), eliminando la dependencia de costosas licencias privativas y ofreciendo un costo de adopción de **$0 en licencias**.

---

## 3. Formulación de Objetivos e Hipótesis

### Objetivo General
Desarrollar un sistema de borradores de escrituras públicas en Python para reducir el tiempo de revisión de la organización de incisos, datos y consistencia documental de 240 minutos a 60 minutos por escritura pública en un bufete jurídico guatemalteco.

### Objetivos Específicos
1. **Diseñar** un modelo de datos estructurado y relacional para la captura, tipado y almacenamiento de la información notarial y de comparecientes.
2. **Desarrollar** un motor de reglas de validación en Python capaz de detectar automáticamente inconsistencias sintácticas, semánticas y de congruencia cruzada (RULE-001 a RULE-020).
3. **Implementar** un módulo de generación documental en formato DOCX que garantice la sustitución íntegra de variables y la ausencia absoluta de placeholders residuales.
4. **Validar** el impacto del sistema mediante una prueba experimental con 100 casos sintéticos distribuidos, contrastando los tiempos del método tradicional frente al método sistematizado.

### Hipótesis General
> *"La implementación de un sistema de borradores de escrituras públicas en Python reducirá el tiempo de revisión de la organización de incisos, datos y consistencia documental de 240 minutos a 60 minutos por escritura pública en un bufete jurídico guatemalteco, mediante la validación automatizada de la información y la estandarización de la estructura documental."*

---

## 4. Arquitectura de la Solución Tecnológica

### 4.1 Principios Arquitectónicos
* **Monolito Modular Local:** Máxima sencillez de despliegue y mantenimiento; funciona 100% desconectado de la nube en Windows 10/11.
* **Aislamiento de Responsabilidades:** Separación estricta entre ORM (SQLAlchemy 2.0), Schemas (Pydantic v2), Controladores API (FastAPI) y Motor de Reglas Notariales.
* **Inmutabilidad y Auditoría:** Las plantillas y los borradores generados se versionan sin sobrescritura destructiva, preservando la trazabilidad de cada cambio.

### 4.2 Diagrama Arquitectónico Conceptual

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                         │
│  - DynamicForm (20 controles tipados)      - Panel de Inconsistencias  │
│  - Gestor de Plantillas DOCX               - Dashboard Experimental    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                         BACKEND (FastAPI API)                          │
│  ├── Core / Auth (Argon2 + JWT + RBAC)                                 │
│  ├── Motor de Reglas Notariales (RULE-001..RULE-020)                   │
│  ├── Ingestor de Documentos (XLSX, CSV, PDF digital pypdf)             │
│  └── Generador DOCX Verificado (docxtpl + python-docx audit)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy 2.0 / Alembic
┌───────────────────────────────────▼────────────────────────────────────┐
│                    ALMACENAMIENTO LOCAL SEGURO                         │
│  - Base de Datos Relacional: SQLite (app.db)                           │
│  - Repositorio de Archivos: backend/uploads/ y backend/generated/      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Diseño del Experimento y Protocolo de Validación (Capítulo IV)

| Parámetro | Definición Experimental |
|:---|:---|
| **Tipo de Investigación** | Cuantitativa, aplicada, diseño cuasiexperimental de comparación antes/después. |
| **Población y Muestra** | 100 casos sintéticos distribuidos equitativamente (20 casos por cada uno de los 5 tipos de escritura). |
| **Tipos de Escritura** | 1. Compraventa de Inmueble, 2. Donación entre Vivos, 3. Arrendamiento, 4. Protocolación de Matrimonio, 5. Constitución de Sociedad. |
| **Condición Experimental** | 50 casos íntegros y 50 casos con inconsistencias deliberadas (DPI discordante, NIT inválido, error en finca/folio/libro, cláusulas desordenadas). |
| **Métrica Primaria** | Tiempo total de revisión y subsanación por instrumento (minutos y segundos). |
| **Métrica Secundaria** | Tasa de detección de inconsistencias (%) y precisión de la auditoría. |
| **Tratamiento Estadístico** | Comparación de medias mediante prueba paramétrica t de Student para muestras pareadas (o prueba no paramétrica de Wilcoxon según normalidad). |

---

## 6. Estructura de la Defensa Oral de Tesis (Diapositivas)

1. **Diapositiva 1:** Portada, Autor, Título Definitivo y Universidad Mariano Gálvez.
2. **Diapositiva 2:** Planteamiento del Problema: La vulnerabilidad del "copiar y pegar" en el notariado guatemalteco.
3. **Diapositiva 3:** Justificación Multidimensional (Científica, Legal - Decreto 314 y Art. 31 CPRG, Económica - $0 licencias).
4. **Diapositiva 4:** Objetivos e Hipótesis de Investigación (Reducción de 240 a 60 min).
5. **Diapositiva 5:** Arquitectura de la Solución (Monolito modular FastAPI + React/TS + docxtpl).
6. **Diapositiva 6:** El Motor de Campos Tipados y Formulario Dinámico Universal.
7. **Diapositiva 7:** El Motor de Reglas Notariales (RULE-001 a RULE-020) y Panel de Inconsistencias.
8. **Diapositiva 8:** Generación DOCX con Verificación Automatizada de Cero Placeholders.
9. **Diapositiva 9:** Demostración en Vivo del Sistema en Funcionamiento (Windows).
10. **Diapositiva 10:** Análisis y Discusión de Resultados Experimentales (Muestra N=100 casos).
11. **Diapositiva 11:** Conclusiones, Aprobación de la Hipótesis y Recomendaciones para el Bufete.
