from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.client import ClientResponse


class CasePartyCreate(BaseModel):
    client_id: str = Field(..., description="UUID del cliente compareciente")
    party_role: str = Field(
        ...,
        description="Rol: COMPRADOR, VENDEDOR, DONANTE, DONATARIO, ARRENDADOR, ARRENDATARIO, CONTRAYENTE, SOCIO, REPRESENTANTE_LEGAL, TESTIGO, INTERPRETE, OTRO",
    )
    notes: str | None = None
    order_index: int = Field(default=0)


class CasePartyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    client_id: str
    party_role: str
    notes: str | None = None
    order_index: int | None = 0
    client: ClientResponse | None = None
    created_at: datetime
    updated_at: datetime


class CaseBase(BaseModel):
    case_type: str = Field(
        default="COMPRAVENTA",
        description="Tipo: COMPRAVENTA, DONACION, ARRENDAMIENTO, MATRIMONIO, SOCIEDAD",
    )
    title: str = Field(..., min_length=5, max_length=250)
    description: str | None = None
    internal_notes: str | None = None
    instrument_number: str | None = Field(None, max_length=30)
    protocol_folio: str | None = Field(None, max_length=30)
    protocol_book: str | None = Field(None, max_length=30)
    assigned_user_id: str | None = None


class CaseCreate(CaseBase):
    parties: list[CasePartyCreate] = Field(
        default_factory=list,
        description="Lista de partes comparecientes al crear el expediente",
    )


class CaseUpdate(BaseModel):
    title: str | None = Field(None, min_length=5, max_length=250)
    description: str | None = None
    internal_notes: str | None = None
    status: str | None = None
    instrument_number: str | None = Field(None, max_length=30)
    protocol_folio: str | None = Field(None, max_length=30)
    protocol_book: str | None = Field(None, max_length=30)
    assigned_user_id: str | None = None


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_number: str
    case_type: str
    status: str
    title: str
    description: str | None = None
    internal_notes: str | None = None
    instrument_number: str | None = None
    protocol_folio: str | None = None
    protocol_book: str | None = None
    opened_at: datetime | None = None
    closed_at: datetime | None = None
    assigned_user_id: str | None = None
    parties: list[CasePartyResponse] = []
    created_at: datetime
    updated_at: datetime


class CaseListResponse(BaseModel):
    total: int
    items: list[CaseResponse]


class AddPartyRequest(BaseModel):
    client_id: str
    party_role: str
    notes: str | None = None
    order_index: int = 0
