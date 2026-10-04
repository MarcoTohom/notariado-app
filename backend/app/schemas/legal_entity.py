from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.client import ClientResponse


class LegalEntityBase(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=200)
    trade_name: str | None = Field(None, max_length=200)
    nit: str = Field(..., max_length=20, description="NIT de la persona jurídica")
    society_type: str = Field(
        default="SOCIEDAD_ANONIMA",
        description="Tipo: SOCIEDAD_ANONIMA, SOCIEDAD_RESPONSABILIDAD_LIMITADA, etc.",
    )
    registry_number: str | None = Field(None, max_length=50)
    registry_folio: str | None = Field(None, max_length=30)
    registry_book: str | None = Field(None, max_length=30)
    legal_representative_id: str | None = Field(
        None,
        description="UUID del cliente (persona individual) que actúa como representante legal",
    )
    representative_position: str | None = Field(None, max_length=100)
    address: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=100)


class LegalEntityCreate(LegalEntityBase):
    status: str = Field(default="ACTIVE")


class LegalEntityUpdate(BaseModel):
    business_name: str | None = Field(None, min_length=2, max_length=200)
    trade_name: str | None = Field(None, max_length=200)
    society_type: str | None = None
    registry_number: str | None = Field(None, max_length=50)
    registry_folio: str | None = Field(None, max_length=30)
    registry_book: str | None = Field(None, max_length=30)
    legal_representative_id: str | None = None
    representative_position: str | None = Field(None, max_length=100)
    address: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=100)
    status: str | None = None


class LegalEntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_name: str
    trade_name: str | None = None
    nit: str
    society_type: str
    registry_number: str | None = None
    registry_folio: str | None = None
    registry_book: str | None = None
    legal_representative_id: str | None = None
    representative_position: str | None = None
    legal_representative: ClientResponse | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class LegalEntityListResponse(BaseModel):
    total: int
    items: list[LegalEntityResponse]
