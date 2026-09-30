---
name: notarial-rule-engine
description: Procedimiento para la ejecución y evaluación del motor de reglas de consistencia documental notarial (RULE-001 a RULE-020).
---

# Procedimiento del Motor de Reglas Notariales

## 1. Catálogo de Reglas Principales
- **RULE-001:** Validación de campos obligatorios según el tipo de escritura.
- **RULE-002:** Formato estructural de DPI (13 dígitos numéricos).
- **RULE-003:** Formato estructural de NIT guatemalteco.
- **RULE-004:** Consistencia de DPI entre el expediente y la comparecencia en el documento.
- **RULE-005:** Consistencia de NIT entre la ficha de cliente y los contratos mercantiles o compraventas.
- **RULE-006:** Consistencia exacta de nombres y apellidos completos.
- **RULE-007:** Consistencia temporal de fechas (fecha de escritura no futura, vigencia de documentos, plazos de contratos).
- **RULE-008:** Consistencia entre montos numéricos y su expresión en letras según el Art. 30 del Código de Notariado.
- **RULE-009 / RULE-010 / RULE-011:** Verificación de identificación de Finca, Folio y Libro.
- **RULE-012 / RULE-013:** Coherencia de Departamento y Municipio en domicilios y ubicación de inmuebles.
- **RULE-014 / RULE-015 / RULE-016:** Secuencialidad y correlación de cláusulas e incisos (detección de saltos o duplicidades).
- **RULE-017:** Detección de variables no sustituidas (`{{ ... }}`) en el borrador generado.
- **RULE-018:** Verificación de cálculos aritméticos (totales, sumas de porcentajes de aportaciones societarias = 100%).

## 2. Flujo de Ejecución del Motor
1. Recibir el `expediente_id` o el borrador documental con sus datos asociados.
2. Ejecutar primero las **Validaciones Estructurales** (campos requeridos, tipos de datos, regex).
3. Ejecutar las **Validaciones de Consistencia Cruzada** contra la base de clientes y expedientes.
4. Generar el reporte de hallazgos con la estructura estandarizada:
   ```json
   {
     "rule_id": "RULE-004",
     "severity": "CRITICAL",
     "field_key": "comprador.dpi",
     "message": "El DPI ingresado (1234567890102) no coincide con el registrado en el expediente (1234567890101).",
     "current_value": "1234567890102",
     "expected_value": "1234567890101",
     "location": "Cláusula Primera, Comparecencia"
   }
   ```
5. Enviar el resultado al frontend para su renderizado inmediato en el **Panel de Inconsistencias**.
