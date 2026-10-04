from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None
    role: str | None = None


class UserSession(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: str
    role: str
    status: str
    permissions: list[str]
