from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=150)
    role: str = Field(default="AUXILIAR")
    status: str = Field(default="ACTIVE")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=150)
    email: EmailStr | None = None
    role: str | None = None
    status: str | None = None
    password: str | None = Field(None, min_length=8, max_length=100)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: EmailStr
    full_name: str
    role: str
    status: str
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None = None


class UserListResponse(BaseModel):
    total: int
    items: list[UserResponse]
