"""Severidades y rutas de campos compartidas por las familias de reglas."""

import re

from app.rules.catalog import RULES_CATALOG


def rule_severity(rule_id: str) -> str:
    return RULES_CATALOG[rule_id]["severity"]


def base_key(path: str) -> str:
    """Último segmento de una ruta de valor, sin índices de lista."""
    tail = path.split(".")[-1]
    return re.sub(r"\[\d+\]", "", tail).lower()


def parent_path(path: str) -> str:
    return path.rsplit(".", 1)[0] if "." in path else ""
