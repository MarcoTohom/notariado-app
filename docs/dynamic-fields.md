# Fase 4: campos dinámicos

La fase funcional 4 mantiene su numeración original. La reorganización estructural 4 dividió [los controles](../frontend/src/features/fields/controls) y [las secciones del editor](../frontend/src/features/fields/editor). FieldControls conserva registro/renderizado; FieldDefinitionEditor conserva orden y recursión. Tipos, validaciones y API permanecen en este módulo. [Informe y comprobaciones](testing/FASE_4_ESTRUCTURAL.md).

Implementación de US-04.1, US-04.2 y US-04.3 (EPIC-04). Incluye el cálculo y las relaciones aunque US-04.3 figure en el Sprint 3: son parte de los veinte tipos de la fase cuatro.

## Uso

1. Iniciar sesión como administrador o notario y abrir **Formularios** → **Nuevo formulario**.
2. Elegir nombre y tipo de escritura. Agregar campos, sus etiquetas, claves, restricciones y ayuda.
3. Para un catálogo, agregar opciones. Para listas, configurar los campos de cada elemento. Para una relación, elegir Clientes o Expedientes y mapear los datos que se autocompletarán.
4. Guardar la versión. Elegir un expediente del mismo tipo y completar el formulario. También se accede desde el detalle de un expediente.
5. Guardar datos: el servidor valida y normaliza todo antes de persistir. Se pueden recuperar después de recargar la página.
6. **Configurar nueva versión** conserva íntegra la anterior. Los valores se asocian a la versión exacta, nunca se reinterpretan automáticamente con una definición nueva.

Auxiliares pueden completar formularios; administradores y notarios pueden configurarlos. Administración no tiene permisos de plantillas. Expedientes finalizados o cancelados se muestran en lectura. Las relaciones seleccionan identificadores existentes, no nombres copiados.

## Tipos y contrato

| Tipo | Control / validación |
|---|---|
| text | Espacios normalizados, longitud, expresión regular y ayuda |
| textarea | Multilínea, contador y longitud |
| name | Unicode NFC, letras del español, apellidos compuestos, guiones y apóstrofes |
| dpi | Texto de 13 dígitos ASCII; conserva ceros iniciales y elimina separadores |
| nit | Texto, separadores normalizados, dígito o K, permite CF; regex adicional configurable |
| phone | Texto de 8–15 dígitos, prefijo + opcional y máscara |
| email | Validación de correo, trim, minúsculas configurables |
| integer | Entero dentro del rango seguro interoperable ±9007199254740991 |
| decimal | Decimal enviado como texto; hasta 24 enteros y 12 decimales |
| currency | Decimal como texto, máximo dos decimales, presentación Q o $, separadores visuales |
| percentage | Decimal como texto, rango 0–100 por defecto, configurable |
| date | Fecha ISO, límites y comparación con otra fecha |
| datetime | Fecha/hora local ISO sin zona horaria, límites y comparación |
| boolean | Checkbox, false es un valor válido incluso si es obligatorio |
| select | Opciones con etiqueta, valor, estado activo y orden |
| relation | Búsqueda de clientes/expedientes; ID validado contra SQLite |
| file | Carga con extensión, contenido, MIME y tamaño comprobados; descarga autenticada |
| list | Objetos con esquema propio; agregar, editar, eliminar y reordenar; hasta 100 filas y 3 niveles |
| computed | Solo lectura, dependencias verificadas, cálculo Decimal en servidor |
| richtext | Editor con negrita, cursiva y párrafos; saneamiento por lista permitida sin atributos HTML |

`template_fields` contiene todos los atributos de la sección 10 de PROJECT_SPEC: key, label, field_type, required, nullable, default_value, min_length/max_length, min_value/max_value, regex, mask, format, options_json, source, source_reference, readonly, calculated, calculation_expression, docx_variable, display_order, help_text, active y timestamps; cada fila pertenece a `template_version_id`.

Las claves usan letras minúsculas, dígitos y guion bajo. `docx_variable` permite rutas con puntos. Claves y variables deben ser únicas dentro de su nivel. `format` es una indicación de presentación; el transporte de fechas siempre es ISO y el de decimales es texto. La máscara usa `0` para dígitos. Para nombres, `comparison_name` normaliza espacios, Unicode y mayúsculas sin perder tildes.

`options_json` contiene `choices` para catálogos; `fields` para listas; `autofill` (clave destino → atributo del cliente); `currency`; `lowercase`; `extensions`; `max_bytes`; `compare_to` y `comparison` (ge/le). Los atributos permitidos del cliente son dpi, nit, address, marital_status, phone, email y full_name. El servidor vuelve a consultar el registro y reemplaza cualquier valor autocompletado enviado por el cliente. `source_reference` identifica el campo relacional de origen como metadato de vinculación; `autofill` declara el mapeo efectivo.

## Cálculos y seguridad

Expresiones permitidas: `precio * cantidad`, `monto * porcentaje / 100`, `suma(bienes.valor)` (también `sum`). Solo +, -, *, /, paréntesis, literales decimales, claves de campos y suma de una columna numérica. No se ejecuta Python, JavaScript ni funciones arbitrarias. Se rechazan ciclos, dependencias inexistentes y expresiones incompatibles. El resultado usa Decimal con redondeo HALF_UP a dos decimales. Dividir entre cero produce un error en el campo, sin guardar datos parciales.

Las expresiones regulares usan un subconjunto portable: sin grupos, alternativas ni referencias inversas y como máximo una repetición de longitud variable. Límites de texto, filas, profundidad y expresión acotan el procesamiento local.

Los valores readonly se obtienen del estado persistido o de su predeterminado; los calculados y autocompletados se derivan en el servidor. En listas, los readonly se derivan del predeterminado o de la relación de cada elemento, nunca de una posición anterior a un reordenamiento.

Archivos: PDF, DOCX, XLSX o CSV UTF-8, hasta 10 MiB (configurable a menos), nombres físicos UUID en `backend/uploads/attachments`. La asociación verifica expediente, versión y ruta del campo; un archivo de una lista puede seguir a su fila al reordenarla. Desvincular no elimina el archivo físico. Los archivos no se ejecutan ni se importan; la extracción de documentos corresponde a fases posteriores. La auditoría registra acción, usuario e identificador, sin copiar valores capturados.

## Persistencia y API

Prefijo `/api/v1/fields`; Swagger incluye esquemas y permisos efectivos.

| Método y ruta | Resultado |
|---|---|
| GET /versions?case_type=COMPRAVENTA | Definiciones versionadas |
| POST /definitions | Nombre, tipo de escritura y fields → nueva definición v1 |
| POST /definitions/{template_id}/versions | fields → nueva versión inmutable |
| GET /versions/{version_id} | Definición exacta |
| GET /cases/{case_id}/versions/{version_id} | values y revision persistidos |
| POST /cases/{case_id}/versions/{version_id}/validate | Normalización, autocompletado, cálculo y errores; no guarda |
| PUT /cases/{case_id}/versions/{version_id} | values y revision → guardado atómico |
| POST /cases/{case_id}/versions/{version_id}/files?field=archivo | Multipart file → identificador |
| GET /cases/{case_id}/files/{file_id} | Descarga autenticada |

Errores de datos: HTTP 422 con `detail.errors: [{path, message}]`, sin reflejar valores sensibles. Ruta de lista: `bienes.0.valor`. El formulario muestra el error junto al control. Cada guardado incrementa `revision`; un guardado con revisión obsoleta devuelve 409 para evitar pérdidas por edición concurrente.

Tablas nuevas: `templates`, `template_versions`, `template_fields`, `case_field_values`, `field_attachments`. Las versiones de esta fase tienen estado `FIELD_DEFINITION`. No representan una plantilla DOCX activa: la carga y el análisis de DOCX corresponden a la fase 5, y la generación a la fase 7.

## Instalación y verificación Windows

Desde la raíz del repositorio (véase la [guía de instalación](installation.md)):

```powershell
.\scripts\setup.ps1 -E2E
.\scripts\test.ps1 -E2E
```

El instalador prepara Chromium en la ubicación usada por el script de pruebas. El [índice documental](README.md) y el [mapa de módulos](modules.md) enlazan el resto de flujos.

`dev.ps1` aplica migraciones antes de iniciar. `phase3_subjects` incorpora la migración faltante de la fase anterior, conservando tablas preexistentes creadas por create_all. `phase4_fields` admite instalaciones que ya hayan creado esas tablas, sin borrar datos. Las pruebas de migración cubren una base nueva y otra preexistente. Las pruebas de API usan SQLite aislado y las de navegador arrancan servicios en 8011/5174 con una base temporal y datos sintéticos. No usan cuentas ni archivos del bufete.

La suite verifica los 20 tipos, bordes numéricos y fechas, listas y rutas de error, relaciones, cálculos manipulados, saneamiento, permisos, descargas, contenido y tamaño de archivos, versiones, concurrencia y rollback. El flujo Chromium configura un formulario, completa los 20 controles, reordena bienes, guarda, recarga y descarga un adjunto. Capturas localmente en `frontend/test-results/`, excluidas de Git.
