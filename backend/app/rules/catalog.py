"""Catálogo de las 20 reglas de consistencia documental notarial.

Cada regla declara su severidad por defecto y una descripción breve para el
panel de inconsistencias. Severidades: CRITICAL > ERROR > WARNING > INFO.
"""

SEVERITY_ORDER = {"CRITICAL": 0, "ERROR": 1, "WARNING": 2, "INFO": 3}

RULES_CATALOG: dict[str, dict[str, str]] = {
    "RULE-001": {
        "severity": "ERROR",
        "name": "Campo obligatorio faltante",
        "description": "Campos marcados como obligatorios en la plantilla sin valor.",
    },
    "RULE-002": {
        "severity": "ERROR",
        "name": "Formato de DPI inválido",
        "description": "El DPI (CUI) debe tener exactamente 13 dígitos numéricos.",
    },
    "RULE-003": {
        "severity": "ERROR",
        "name": "Formato de NIT inválido",
        "description": "El NIT debe seguir el formato guatemalteco (ej. 1234567-8 o CF).",
    },
    "RULE-004": {
        "severity": "CRITICAL",
        "name": "DPI no coincide con el expediente",
        "description": "El DPI del documento difiere del registrado en la ficha del cliente.",
    },
    "RULE-005": {
        "severity": "ERROR",
        "name": "NIT no coincide con el expediente",
        "description": "El NIT del documento difiere del registrado en la ficha del cliente.",
    },
    "RULE-006": {
        "severity": "CRITICAL",
        "name": "Nombre no coincide con el expediente",
        "description": "El nombre del compareciente difiere de la ficha maestra del cliente.",
    },
    "RULE-007": {
        "severity": "ERROR",
        "name": "Fecha inconsistente",
        "description": "Fechas futuras no permitidas o rangos de fechas invertidos.",
    },
    "RULE-008": {
        "severity": "ERROR",
        "name": "Monto en números no coincide con letras",
        "description": "Art. 30 Código de Notariado: la cifra debe corresponder a su redacción en letras.",
    },
    "RULE-009": {
        "severity": "ERROR",
        "name": "Número de finca inválido",
        "description": "La finca registral es obligatoria y debe ser numérica.",
    },
    "RULE-010": {
        "severity": "ERROR",
        "name": "Número de folio inválido",
        "description": "El folio registral es obligatorio y debe ser numérico.",
    },
    "RULE-011": {
        "severity": "ERROR",
        "name": "Número de libro inválido",
        "description": "El libro registral es obligatorio para inmuebles.",
    },
    "RULE-012": {
        "severity": "ERROR",
        "name": "Departamento inválido",
        "description": "El departamento no existe en el catálogo oficial de Guatemala (22).",
    },
    "RULE-013": {
        "severity": "WARNING",
        "name": "Municipio no verificable",
        "description": "El municipio no corresponde al departamento indicado o no consta en catálogo.",
    },
    "RULE-014": {
        "severity": "ERROR",
        "name": "Inciso faltante",
        "description": "La secuencia de cláusulas/incisos presenta saltos de numeración.",
    },
    "RULE-015": {
        "severity": "ERROR",
        "name": "Inciso duplicado",
        "description": "Existen cláusulas o incisos con la misma numeración.",
    },
    "RULE-016": {
        "severity": "WARNING",
        "name": "Numeración desordenada",
        "description": "Los incisos no aparecen en orden ascendente.",
    },
    "RULE-017": {
        "severity": "CRITICAL",
        "name": "Variable de plantilla sin sustituir",
        "description": "Se detectó sintaxis {{ ... }} sin sustituir (residuo de plantilla).",
    },
    "RULE-018": {
        "severity": "ERROR",
        "name": "Cálculo aritmético inconsistente",
        "description": "Sumas de porcentajes de aportaciones deben totalizar 100%.",
    },
    "RULE-019": {
        "severity": "ERROR",
        "name": "Archivo adjunto no válido",
        "description": "Adjunto inexistente en disco, fuera de tamaño o con extensión no permitida.",
    },
    "RULE-020": {
        "severity": "ERROR",
        "name": "Registro duplicado",
        "description": "El mismo compareciente figura más de una vez con el mismo rol.",
    },
}
