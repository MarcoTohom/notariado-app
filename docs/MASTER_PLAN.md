# PLAN MAESTRO INTEGRAL DEL PROYECTO (MASTER ROADMAP)
**Sistema de Borradores de Escrituras Públicas en Python**  
**Proyecto de Graduación 2 - Universidad Mariano Gálvez de Guatemala**

---

## 1. Visión y Alcance del Plan Maestro

El presente documento articula la planificación integral del proyecto de investigación aplicada y desarrollo de software, estructurado en **11 fases de desarrollo**, organizadas bajo la metodología ágil **Scrum** en **6 Sprints de trabajo**, asegurando la entrega de documentación formal académica, aseguramiento de calidad y validación experimental de hipótesis.

---

## 2. Mapa Documental y Enlaces de Seguimiento

| Dimensión | Documento Oficial en el Repositorio | Propósito |
|:---|:---|:---|
| **Metodología Scrum** | [`docs/scrum/PRODUCT_BACKLOG.md`](file:///C:/Users/marco/.gemini/antigravity-ide/scratch/sistema-borradores-escrituras/docs/scrum/PRODUCT_BACKLOG.md) | Catálogo de 11 Épicas, 35+ Historias de Usuario priorizadas por MoSCoW (254 Story Points). |
| **Metodología Scrum** | [`docs/scrum/SPRINT_PLANNING.md`](file:///C:/Users/marco/.gemini/antigravity-ide/scratch/sistema-borradores-escrituras/docs/scrum/SPRINT_PLANNING.md) | Cronograma detallado de los 6 Sprints de 2 semanas, asignación de puntos y ceremonias. |
| **Metodología Scrum** | [`docs/scrum/DEFINITION_OF_DONE.md`](file:///C:/Users/marco/.gemini/antigravity-ide/scratch/sistema-borradores-escrituras/docs/scrum/DEFINITION_OF_DONE.md) | Estándares de calidad de 10 puntos por entrega y criterios específicos por módulo. |
| **Defensa y Tesis** | [`docs/presentation/PRESENTACION_EJECUTIVA_PROYECTO.md`](file:///C:/Users/marco/.gemini/antigravity-ide/scratch/sistema-borradores-escrituras/docs/presentation/PRESENTACION_EJECUTIVA_PROYECTO.md) | Documento formal para la Terna Evaluadora UMG, justificación legal (Dto 314, Art 31 CPRG) y estructura de diapositivas. |
| **QA y Experimento** | [`docs/testing/TEST_PLAN_AND_EXPERIMENT.md`](file:///C:/Users/marco/.gemini/antigravity-ide/scratch/sistema-borradores-escrituras/docs/testing/TEST_PLAN_AND_EXPERIMENT.md) | Estrategia de pruebas en 4 niveles y protocolo formal del experimento con 100 casos sintéticos. |
| **Especificación Base** | [`docs/PROJECT_SPEC.md`](file:///C:/Users/marco/.gemini/antigravity-ide/scratch/sistema-borradores-escrituras/docs/PROJECT_SPEC.md) | Especificación técnica maestra de 52 secciones. |

---

## 3. Hoja de Ruta de Fases de Desarrollo (Fase 1 a Fase 11)

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              CRONOGRAMA MAESTRO DE FASES                               │
 ├────────────────────────────────┬───────────────────────┬───────────────────────────────┤
 │ FASE                           │ SPRINT ASOCIADO       │ ENTREGABLE PRINCIPAL          │
 ├────────────────────────────────┼───────────────────────┼───────────────────────────────┤
 │ Fase 1: Arquitectura Base      │ Sprint 1              │ FastAPI + React + SQLite + CI │
 │ Fase 2: Seguridad & RBAC       │ Sprint 1              │ Argon2 + JWT + Roles          │
 │ Fase 3: Sujetos & Expedientes  │ Sprint 1              │ Clientes + Expedientes        │
 │ Fase 4: Campos Dinámicos       │ Sprint 2              │ DynamicForm + 20 tipos        │
 │ Fase 5: Plantillas DOCX        │ Sprint 2              │ Versionamiento Jinja2         │
 │ Fase 6: Reglas Notariales      │ Sprint 3              │ Motor RULE-001..RULE-020      │
 │ Fase 7: Generación DOCX        │ Sprint 3              │ Render docxtpl auditado       │
 │ Fase 8: Ingesta de Archivos    │ Sprint 4              │ Importador XLSX/CSV/PDF       │
 │ Fase 9: Módulo Financiero      │ Sprint 5              │ Cotizaciones, Cobros y Pagos  │
 │ Fase 10: Aseguramiento QA      │ Sprints 4, 5 y 6      │ Suite pytest + Playwright E2E │
 │ Fase 11: Experimento de Tesis  │ Sprint 6              │ 100 casos + Reporte de tiempos│
 └────────────────────────────────┴───────────────────────┴───────────────────────────────┘
```

---

## 4. Matriz de Dependencias y Ruta Crítica

1. **Ruta Crítica Absoluta:**
   $$\text{Modelo de Datos} \longrightarrow \text{Campos Tipados} \longrightarrow \text{Plantillas DOCX} \longrightarrow \text{Motor de Reglas} \longrightarrow \text{Generador Verificado} \longrightarrow \text{Medición Experimental}$$
2. **Dependencias Clave:**
   * La **Generación DOCX (Fase 7)** depende del **Motor de Campos (Fase 4)** y del **Repositorio de Plantillas (Fase 5)**.
   * El **Motor de Reglas (Fase 6)** se ejecuta tanto en el formulario web como antes de la autorización final del borrador.
   * El **Experimento de Tesis (Fase 11)** requiere tener operativas las Fases 3 a 7 para correr los 100 casos sintéticos y registrar los tiempos de revisión.

---

## 5. Procedimiento de Ejecución y Paso a Paso

Cada fase se ejecutará de forma secuencial y acumulativa:
* Al iniciar una fase, se toman las Historias de Usuario correspondientes en el Backlog.
* Se implementa primero el backend (modelos, esquemas, servicios, reglas).
* Se implementa la interfaz de usuario en React.
* Se ejecutan las pruebas automatizadas asociadas (`pytest` y `npm test`).
* Se valida el criterio de aceptación del módulo.
* Se emite el reporte de progreso al usuario.
