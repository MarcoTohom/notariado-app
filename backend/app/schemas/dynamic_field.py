"""Contracts for versioned typed forms. Decimal values travel as strings."""

import re
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

FieldType = Literal[
    "text",
    "textarea",
    "name",
    "dpi",
    "nit",
    "phone",
    "email",
    "integer",
    "decimal",
    "currency",
    "percentage",
    "date",
    "datetime",
    "boolean",
    "select",
    "relation",
    "file",
    "list",
    "computed",
    "richtext",
]


class CatalogOption(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: str = Field(min_length=1, max_length=150)
    value: str = Field(min_length=1, max_length=150)
    active: bool = True
    order: int = 0


class FieldOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")
    choices: list[CatalogOption] = Field(default_factory=list, max_length=200)
    fields: list["FieldDefinition"] = Field(default_factory=list, max_length=50)
    autofill: dict[str, str] = Field(default_factory=dict)
    extensions: list[Literal[".pdf", ".docx", ".xlsx", ".csv"]] = Field(
        default_factory=lambda: [".pdf", ".docx", ".xlsx", ".csv"]
    )
    max_bytes: int = Field(default=10 * 1024 * 1024, ge=1, le=10 * 1024 * 1024)
    lowercase: bool = True
    currency: Literal["GTQ", "USD"] = "GTQ"
    compare_to: str | None = None
    comparison: Literal["ge", "le"] = "ge"


class FieldDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    key: str = Field(pattern=r"^[a-z][a-z0-9_]{0,63}$")
    label: str = Field(min_length=1, max_length=150)
    field_type: FieldType
    required: bool = False
    nullable: bool = True
    default_value: Any = None
    min_length: int | None = Field(default=None, ge=0, le=10000)
    max_length: int | None = Field(default=None, ge=0, le=10000)
    min_value: str | None = Field(default=None, max_length=64)
    max_value: str | None = Field(default=None, max_length=64)
    regex: str | None = Field(default=None, max_length=200)
    mask: str | None = Field(default=None, max_length=80)
    format: str | None = Field(default=None, max_length=80)
    options_json: FieldOptions = Field(default_factory=FieldOptions)
    source: Literal["manual", "clients", "cases"] = "manual"
    source_reference: str | None = Field(default=None, max_length=64)
    readonly: bool = False
    calculated: bool = False
    calculation_expression: str | None = Field(default=None, max_length=500)
    docx_variable: str | None = Field(default=None, pattern=r"^[a-zA-Z][\w.]{0,149}$")
    display_order: int = Field(default=0, ge=0)
    help_text: str | None = Field(default=None, max_length=500)
    active: bool = True

    @model_validator(mode="after")
    def validate_definition(self):
        from app.services.field_validation import (
            decimal_value,
            expression_tree,
            validate_pattern,
        )

        if self.key in {"constructor", "prototype", "__proto__"}:
            raise ValueError("Clave reservada.")
        if (
            self.min_length is not None
            and self.max_length is not None
            and self.min_length > self.max_length
        ):
            raise ValueError("La longitud mínima supera la máxima.")
        if not self.label.strip():
            raise ValueError("La etiqueta no puede estar vacía.")
        if self.regex:
            validate_pattern(self.regex)
        bounds = []
        for value in (self.min_value, self.max_value):
            if value is None:
                bounds.append(None)
            elif self.field_type == "date":
                bounds.append(date.fromisoformat(value))
            elif self.field_type == "datetime":
                parsed = datetime.fromisoformat(value)
                if parsed.tzinfo:
                    raise ValueError("Use fecha y hora local sin zona horaria.")
                bounds.append(parsed)
            else:
                if self.field_type not in {
                    "integer",
                    "decimal",
                    "currency",
                    "percentage",
                    "computed",
                }:
                    raise ValueError(
                        "Los límites de valor requieren un campo numérico o fecha."
                    )
                bounds.append(decimal_value(value))
        if all(v is not None for v in bounds) and bounds[0] > bounds[1]:
            raise ValueError("El mínimo supera el máximo.")
        if self.field_type == "computed" or self.calculated:
            if self.field_type not in {
                "integer",
                "decimal",
                "currency",
                "percentage",
                "computed",
            }:
                raise ValueError("Un campo calculado debe ser numérico.")
            self.calculated = True
            self.readonly = True
            if not self.calculation_expression:
                raise ValueError("Indique una expresión de cálculo.")
            expression_tree(self.calculation_expression)
        if self.field_type == "relation" and self.source not in {"clients", "cases"}:
            raise ValueError("Una relación requiere origen clients o cases.")
        if self.field_type == "select":
            values = [o.value for o in self.options_json.choices]
            if not values or len(values) != len(set(values)):
                raise ValueError("El catálogo debe contener valores únicos.")
        if self.field_type == "list" and not self.options_json.fields:
            raise ValueError("Defina los campos de cada elemento de la lista.")
        if self.mask and not re.fullmatch(r"[0 +()\-]+", self.mask):
            raise ValueError("La máscara usa 0 para dígitos y separadores +()-.")
        return self


class DefinitionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=150)
    case_type: Literal[
        "COMPRAVENTA", "DONACION", "ARRENDAMIENTO", "MATRIMONIO", "SOCIEDAD"
    ]
    fields: list[FieldDefinition] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def name_not_blank(self):
        self.name = self.name.strip()
        if not self.name:
            raise ValueError("Indique el nombre del formulario.")
        return self


class VersionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fields: list[FieldDefinition] = Field(min_length=1, max_length=100)


class ValuesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    values: dict[str, Any] = Field(default_factory=dict)
    revision: int = Field(default=0, ge=0)


class FieldIssue(BaseModel):
    path: str
    message: str


class ValidationResult(BaseModel):
    values: dict[str, Any]
    errors: list[FieldIssue]


class VersionResponse(BaseModel):
    id: str
    template_id: str
    version_number: int
    name: str
    case_type: str
    fields: list[FieldDefinition]


class ValuesResponse(ValidationResult):
    revision: int
