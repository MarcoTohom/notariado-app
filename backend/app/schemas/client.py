import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def validate_dpi(value: str) -> str:
    """Valida que el DPI guatemalteco sea exactamente 13 caracteres numéricos."""
    cleaned = value.strip()
    if not re.match(r"^\d{13}$", cleaned):
        raise ValueError(
            f"El DPI debe contener exactamente 13 dígitos numéricos. Se recibió: '{cleaned}' ({len(cleaned)} caracteres)."
        )
    return cleaned


def normalize_name(value: str) -> str:
    """Normaliza nombres: elimina espacios extra, conserva tildes y mayúsculas."""
    return " ".join(value.strip().split())


class ClientBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    dpi: str = Field(
        ..., min_length=13, max_length=13, description="DPI guatemalteco: 13 dígitos"
    )
    nit: str | None = Field(
        None, max_length=20, description="NIT como texto (no entero)"
    )
    marital_status: str | None = Field(None, max_length=30)
    profession: str | None = Field(None, max_length=100)
    nationality: str = Field(default="GUATEMALTECA", max_length=50)
    birth_date: str | None = Field(
        None, max_length=10, description="Formato YYYY-MM-DD"
    )
    address: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=100)

    @field_validator("dpi")
    @classmethod
    def check_dpi(cls, v: str) -> str:
        return validate_dpi(v)

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_names(cls, v: str) -> str:
        return normalize_name(v)


class ClientCreate(ClientBase):
    status: str = Field(default="ACTIVE")


class ClientUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=2, max_length=100)
    last_name: str | None = Field(None, min_length=2, max_length=100)
    nit: str | None = Field(None, max_length=20)
    marital_status: str | None = Field(None, max_length=30)
    profession: str | None = Field(None, max_length=100)
    nationality: str | None = Field(None, max_length=50)
    birth_date: str | None = Field(None, max_length=10)
    address: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=100)
    status: str | None = None

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def normalize_names(cls, v: str | None) -> str | None:
        if v is not None:
            return normalize_name(v)
        return v


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    dpi: str
    nit: str | None = None
    marital_status: str | None = None
    profession: str | None = None
    nationality: str
    birth_date: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class ClientListResponse(BaseModel):
    total: int
    items: list[ClientResponse]
