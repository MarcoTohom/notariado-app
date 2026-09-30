from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SystemInfo(BaseModel):
    version: str
    environment: str
    debug: bool
    database: str
    timestamp: datetime


class HealthResponse(BaseModel):
    status: str
    app: str
    system: SystemInfo
    checks: dict[str, Any]
