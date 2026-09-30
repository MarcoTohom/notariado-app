---
name: docx-template
description: Procedimiento estándar para la carga de plantillas DOCX, extracción léxica de variables Jinja2, vinculación a campos tipados y generación verificada de borradores sin placeholders residuales.
---

# Procedimiento de Gestión y Generación de Plantillas DOCX

## 1. Carga e Ingesta de Plantilla
1. Recibir archivo `.docx` mediante endpoint multipart autenticado.
2. Validar que el archivo sea un DOCX válido abriéndolo con `python-docx`.
3. Guardar el archivo en `backend/uploads/templates/` con nombre UUID seguro.
4. Crear registro en `templates` y generar la primera versión en `template_versions` (estado: borrador).

## 2. Análisis y Detección de Variables
1. Extraer el texto completo de párrafos y tablas.
2. Utilizar regex para detectar variables con formato Jinja2:
   - Variables simples: `\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}`
   - Bucles de listas: `\{%\s*for\s+(\w+)\s+in\s+([a-zA-Z0-9_]+)\s*%\}`
   - Condiciones: `\{%\s*if\s+([a-zA-Z0-9_\.]+)\s*%\}`
3. Registrar las variables encontradas en `template_fields` asignando automáticamente o sugiriendo el tipo de campo (`name`, `dpi`, `nit`, `currency`, `date`, `list`).

## 3. Generación del Borrador Notarial
1. Cargar la versión activa de la plantilla con `docxtpl.DocxTemplate`.
2. Preparar el diccionario de contexto a partir de los datos validados del expediente y clientes.
3. Ejecutar `doc.render(context)`.
4. Guardar el documento resultante en `backend/generated/` con identificador único de versión.
5. **Paso Obligatorio de Verificación:**
   - Abrir el documento generado con `python-docx`.
   - Recorrer todos los párrafos y celdas de tablas buscando si persiste el patrón `{{`.
   - Si existen variables no sustituidas, marcar la generación con advertencia o error en `document_versions.validation_status`.
   - Si está limpio, registrar la versión como lista para revisión notarial.
