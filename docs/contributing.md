# Convenciones de contribución

Estas convenciones acompañan las [reglas permanentes](../AGENTS.md), el [mapa actual](modules.md) y el [plan estructural](PLAN_MEJORA_ESTRUCTURAL.md). Revisadas el **8 de octubre de 2026**. [Índice documental](README.md).

## Ubicación y nombres

| Tipo de cambio | Ubicación y convención |
|---|---|
| Entrada HTTP backend | `backend/app/api/v1/endpoints/<modulo>.py`; registrar router en `api.py` |
| Contrato backend | `backend/app/schemas/<modulo>.py`; Pydantic v2 |
| Coordinación backend | `backend/app/services/<responsabilidad>_service.py`; funciones y archivos `snake_case` |
| Persistencia | `backend/app/models/`; migraciones en `backend/alembic/versions/` si cambia el esquema |
| Regla documental | `backend/app/rules/`; conservar identificadores, catálogo y orden de ejecución |
| Pantalla o componente React | `frontend/src/features/<funcionalidad>/`; componentes y archivos `.tsx` en `PascalCase` |
| Tipos y llamadas de una funcionalidad | `types.ts` y `api.ts` dentro de su módulo |
| UI común | `frontend/src/components/common/` cuando varios consumidores concretos comparten la misma responsabilidad |
| Utilidad frontend | `frontend/src/lib/`; nombre descriptivo en `camelCase` o convención existente |
| Operación Windows | `scripts/<operacion>.ps1`; rutas resueltas desde el script y errores con salida fallida |

No todos los módulos requieren subcarpetas `hooks`, `pages` o `components`: crearlas cuando el contenido lo justifique. Los modelos de campos, plantillas y adjuntos permanecen agrupados actualmente; su división pertenece a la fase 5.

## Tipos, HTTP e imports

El cliente Axios está en `shared/api/client.ts`; los mensajes comunes de error, en `shared/api/errors.ts`. Las llamadas de cada funcionalidad están en `features/<modulo>/api.ts` y sus contratos en `types.ts`. Mantener los parámetros, payloads y tipos junto a su operación; usar el cliente común para conservar la configuración y sesión.

Un tipo pertenece al módulo que define su significado. Llevarlo a una ubicación compartida solo si varios módulos lo necesitan y su responsabilidad es común: `shared/types.ts` contiene CaseType, usado por expedientes, plantillas y experimento. Usar `import type` para contratos que no necesitan código en ejecución. Las páginas consumen la API de su funcionalidad; la infraestructura HTTP no importa pantallas. Evitar dependencias circulares y reexports globales sin consumidores. No quedan reexports de compatibilidad tras la fase 3.

La composición de proveedores, rutas y layout está en `src/app/`; la sesión y los controles de acceso, en `features/auth/`. Añadir rutas en `AppRoutes.tsx` y conservar su autorización en backend.

La UI común está en `components/common/`: Modal reúne contenedor y cabecera; ModalFrame permite la presentación de confirmación; ModalBody y ModalActions conservan cuerpo y acciones. La funcionalidad decide apertura, cierre, consultas, errores y envío. Mantener las acciones de envío dentro de su formulario y usar `type="button"` en botones de cierre. Feedback reúne errores y carga; Badge recibe el estilo semántico de su consumidor; formStyles conserva las variantes visuales de campos. Evitar trasladar servicios o lógica de dominio a estos componentes.

Los controles dinámicos están en `features/fields/controls/`; FieldControls conserva registro y composición. ListInput recibe el renderizador anidado por prop para evitar un ciclo con FieldControls. El estado de actividad de adjuntos está en FileActivityContext y lo consume DynamicForm. Las secciones del editor están en `features/fields/editor/`; reciben una definición y un callback de cambios parciales. Orden, expansión y recursión pertenecen a FieldDefinitionEditor. Conservar merges de options_json, tipos y normalización al añadir opciones.

En backend, mantener la entrada HTTP en routers y la coordinación en servicios. Exponer funciones compartidas con nombre público y responsabilidad explícita; evitar nuevos imports de funciones privadas de otro servicio. Los imports existentes de `_build_context` se resolverán en fase 5. Cualquier extracción debe preservar commit, flush, rollback y errores: un cambio de ubicación no autoriza modificar límites de transacción.

## Datos, archivos y pruebas

DPI y NIT permanecen como texto. Dinero se calcula con `Decimal` y se transporta en texto. Generar DOCX en backend con `docxtpl`, verificar variables residuales con `python-docx` y conservar versiones anteriores. Usar únicamente datos sintéticos; no incorporar contraseñas, tokens, bases del bufete ni documentos reales a logs, fixtures o Git.

Las pruebas backend se separan entre `tests/unit` y `tests/integration`; los recursos generales existentes están en `tests/conftest.py`. Mantener pruebas React junto a su módulo en `__tests__`; `src/test/setup.ts` configura Vitest. Los recursos compartidos se extraerán en fase 6 cuando haya repetición comprobada. Los E2E están en `frontend/e2e` y usan servicios y almacenamiento temporales.

Preparar el entorno según [installation.md](installation.md). Desde la raíz:

```powershell
.\scripts\test.ps1
.\scripts\test.ps1 -E2E
```

Elegir comprobaciones según el alcance: backend para servicios/reglas, lint, tipos, Vitest y build para frontend, y E2E cuando se afecta interacción del flujo cubierto. Para documentación, revisar enlaces, rutas y comandos contra código e informes de ejecución existentes. Ejecutar la suite completa al cerrar la reorganización o cuando nuevas modificaciones o fallos lo requieran.

## Documentación y entrega

Actualizar [modules.md](modules.md), [architecture.md](architecture.md) e [índice](README.md) cuando cambien ubicaciones o responsabilidades. Separar requisitos previstos, implementación disponible y comprobaciones ejecutadas. Conservar antecedentes académicos y anotar su carácter de planificación.

Registrar alcance, comandos y resultados en el plan y en el informe de fase. Comparar API, permisos, esquema y escenarios con la [referencia inicial](testing/BASELINE_ESTRUCTURAL.md) cuando la extracción pueda afectarlos. Revisar el diff y `git diff --check` antes de cerrar. Los cambios estructurales sin cambio de persistencia no requieren nuevas tablas ni migraciones.
