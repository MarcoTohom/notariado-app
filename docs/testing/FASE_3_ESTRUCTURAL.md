# Fase estructural 3: API, tipos y composición del frontend

Fecha: **2026-10-08**. Referencia anterior: commit `338d6b0`. [Índice documental](../README.md) · [Plan y estado](../PLAN_MEJORA_ESTRUCTURAL.md) · [Mapa actualizado](../modules.md).

## Entrega

Las llamadas HTTP y los contratos se ubican junto a su funcionalidad: dashboard, autenticación, usuarios, auditoría, clientes/personas jurídicas, expedientes, campos, plantillas, validación, documentos y experimento. Se retiraron `services/api.ts` y `types/index.ts` después de actualizar todos sus consumidores, incluidas las pruebas. No quedan reexports de compatibilidad.

`shared/api/client.ts` contiene la instancia Axios, la URL pública, los encabezados, el tiempo máximo de espera y el interceptor que lee la sesión vigente. `shared/api/errors.ts` conserva el tratamiento común de mensajes. `shared/types.ts` contiene CaseType, utilizado por expedientes, plantillas y experimento; los demás contratos trasladados pertenecen a sus módulos. Los contratos de campos existentes se conservaron.

`App.tsx` compone AppProviders y AppRoutes. `src/app/` contiene proveedores, rutas y layout; `features/auth/` reúne AuthContext, LoginModal y RequireAuth. UserManagementModal se ubica en usuarios y SystemHealthBadge en dashboard. Se conservan textos, estilos y cuerpos de los componentes. Las carpetas antiguas vacías se retiraron después de trasladar sus archivos.

## Verificación de equivalencia

La comparación AST con el commit anterior comprobó:

- **13 declaraciones** de infraestructura/servicios y **50 declaraciones de tipos** idénticas tras su traslado; mismo interceptor y encabezado multipart.
- Cuerpos de **46 archivos fuente existentes** sin cambios después de excluir imports. Incluye los componentes trasladados y las aserciones de las pruebas existentes.
- **7 rutas de pantalla**, sus componentes y permisos, y la redirección de ruta desconocida a `/`, conservados.
- RequireAuth y AppLayout conservados; mismos valores de QueryClient y orden QueryClientProvider → AuthProvider → BrowserRouter.
- **210 imports relativos** comprobados, sin destinos rotos ni ciclos de imports de ejecución.
- Código backend, scripts operativos, configuración y dependencias sin cambios.

[Evidencia de estructura y contratos](phase3/structure-verification.json). Esta comprobación conserva firmas y construcción de peticiones; las pruebas de transporte y navegador comprueban también su ejecución en los escenarios indicados.

## Pruebas ejecutadas

| Comando desde frontend | Resultado |
|---|---|
| `npm.cmd run lint` | Aprobado, sin advertencias ESLint |
| `npm.cmd run test` | **102 pruebas**, 11 archivos, aprobadas en 14.20 s |
| `npm.cmd run build` | TypeScript y Vite aprobados; 1820 módulos transformados |
| `npm.cmd run test:e2e` | **1 escenario Chromium aprobado**, ejecución total 35.5 s |

Se conservaron los **85 escenarios frontend anteriores** y se agregaron **17** para riesgos de la extracción: seis de transporte compartido, seis de mensajes de error y cinco de acceso a pantallas. El transporte usa un adaptador Axios aislado que inspecciona peticiones con datos sintéticos; no consulta servicios externos. Comprueba sesión actualizada/cerrada, DPI/NIT de texto, decimales de texto, paginación, opciones de generación, FormData y URL configurada.

El E2E utilizó el comando y configuración Playwright existentes, con Chromium en la ubicación definida por `scripts/common.ps1`, servidores temporales y SQLite sintético. Se restauraron TEMP, TMP, PLAYWRIGHT_BROWSERS_PATH y la carpeta de trabajo. Su flujo cubre formularios dinámicos, guardado, recuperación, cálculo y descarga de adjunto.

[Resultados de ejecución](phase3/verification-results.json) · [Comprobación documental](phase3/documentation-verification.json).

## Límites y seguimiento

La suite backend de 260 escenarios permanece como evidencia de fase 1 y no se repitió: no cambiaron código, scripts, esquema ni configuración backend. El E2E actual no acredita cobertura integral de todas las pantallas ni el experimento formal; esa comprobación corresponde al cierre estructural.

Vite mantiene los avisos preexistentes por comentarios de Zod y tamaño de bundle. El JavaScript de producción es aproximadamente 602.40 kB, gzip 171.90 kB. Esta fase no actualiza dependencias ni introduce carga diferida de pantallas. Los enlaces y el comportamiento de descarga existentes se conservaron.

La siguiente fase extraerá componentes y controles compartidos cuando exista repetición concreta. El mapa, arquitectura y convenciones ya reflejan la estructura de esta entrega.
