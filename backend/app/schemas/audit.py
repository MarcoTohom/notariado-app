from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    action: str
    module: str
    record_id: str | None = None
    details: str | None = None
    ip_address: str | None = None
    status: str = "SUCCESS"


class AuditLogCreate(AuditLogBase):
    user_id: str | None = None
    user_email: str | None = None


class AuditLogResponse(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None = None
    user_email: str | None = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    total: int
    items: list[AuditLogResponse]
