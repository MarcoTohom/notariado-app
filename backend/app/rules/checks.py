"""Registro de funciones del motor; conserva el orden oficial de RULE-001..020."""

from app.rules.document_checks import (
    rule_014_015_016_clauses,
    rule_017_placeholders,
    rule_019_attachments,
)
from app.rules.identity_checks import (
    rule_001_required,
    rule_002_dpi_format,
    rule_003_nit_format,
    rule_004_dpi_consistency,
    rule_005_nit_consistency,
    rule_006_name_consistency,
    rule_020_duplicates,
)
from app.rules.registry_checks import (
    rule_009_finca,
    rule_010_folio,
    rule_011_libro,
    rule_012_department,
    rule_013_municipality,
)
from app.rules.temporal_amount_checks import (
    rule_007_dates,
    rule_008_amount_letters,
    rule_018_percentage_sum,
)

RULE_FUNCTIONS = [
    rule_001_required,
    rule_002_dpi_format,
    rule_003_nit_format,
    rule_004_dpi_consistency,
    rule_005_nit_consistency,
    rule_006_name_consistency,
    rule_007_dates,
    rule_008_amount_letters,
    rule_009_finca,
    rule_010_folio,
    rule_011_libro,
    rule_012_department,
    rule_013_municipality,
    rule_014_015_016_clauses,
    rule_017_placeholders,
    rule_018_percentage_sum,
    rule_019_attachments,
    rule_020_duplicates,
]
