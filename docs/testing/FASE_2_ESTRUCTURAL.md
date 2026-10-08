# Fase estructural 2: documentación y convenciones

Fecha: **2026-10-08**. Entrega anterior conservada en el commit `a48ef71`. [Índice documental](../README.md) · [Plan y estado](../PLAN_MEJORA_ESTRUCTURAL.md).

## Alcance realizado

- Índice con guías operativas, técnicas y académicas.
- Arquitectura contrastada con las capas existentes y explicación del uso local de las API.
- Mapa de pantallas, permisos, rutas, servicios y pruebas; módulos previstos identificados.
- Persistencia documentada con las tablas reales, NIT de texto y valores JSON/Decimal.
- Convenciones para nombres, ubicación de tipos y HTTP, componentes comunes, imports públicos y recursos de pruebas.
- Seis enlaces del plan maestro corregidos y referencias antiguas de generación sintética y E2E actualizadas.
- Instalación enlazada al índice y a su evidencia de ejecución. Se conserva el procedimiento verificado en fase 1.
- Documentación académica e historial conservados, con aclaraciones sobre planificación y evidencia disponible.

## Decisiones y límites

Se mantiene el backend por capas y se completa la organización frontend por funcionalidad en fase 3. Las extracciones de UI, servicios y recursos de pruebas corresponden a fases posteriores. Esta entrega no mueve código, modifica lógica, agrega módulos funcionales ni altera modelos, permisos, reglas o contratos.

La actualización del protocolo corrige la correspondencia con las rutas, tablas y distribución del corpus implementados. No cambia el generador, las pruebas estadísticas ni el procedimiento de medición. Las pruebas de software y el corpus sintético no acreditan la meta temporal del experimento.

Se conserva la clasificación de anomalías del diseño académico original y se identifica su diferencia respecto al reparto del generador actual. La resolución metodológica de esa diferencia corresponde al experimento formal; esta fase registra el estado existente.

## Verificación

Estado: **completada**. [Evidencia de comprobación](phase2/verification-results.json).

| Comprobación | Resultado |
|---|---|
| Enlaces de README y documentación | 20 archivos Markdown revisados; sin destinos internos ausentes |
| Operaciones del mapa frente a OpenAPI | 11 métodos y rutas coinciden con el contrato conservado |
| Navegación del mapa frente a App.tsx | Las 7 rutas de pantalla están documentadas |
| Modelos y mapa de tablas frente al esquema | Las 18 tablas, incluida Alembic, coinciden |
| Scripts operativos referenciados | Existen setup, test, seed, dev, backup y experiment |
| Alcance de Git y formato | Solo documentación; `git diff --check` aprobado |

La comprobación se realizó con Python estándar: resolución de destinos Markdown fuera de bloques de código, lectura de OpenAPI y del esquema conservado, inventario de rutas React, extracción AST de nombres de tablas y revisión del diff. No se consultaron enlaces web ni se modificó la base operativa.

La suite completa ya ejecutada en fase 1 aprobó 260 escenarios backend, 85 frontend y un E2E, además de lint, formato, tipos y compilación. La preparación nueva y repetida, el arranque y los respaldos se probaron en Windows PowerShell 5.1. [Informe y evidencia de fase 1](FASE_1_ESTRUCTURAL.md).

Esta entrega documental se verifica mediante revisión de enlaces, correspondencia de rutas con OpenAPI, tablas con el esquema, comandos con los scripts y alcance del diff. No se repite la suite funcional porque el código ejecutable y su configuración permanecen iguales al commit anterior.

La fase estructural 3 puede comenzar desde esta referencia: distribución de tipos y llamadas HTTP por funcionalidad y separación de la composición de App.tsx, conservando navegación y permisos.
