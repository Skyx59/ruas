from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import UUID4, BaseModel


class Role(StrEnum):
    USER = "USER"
    ADMIN = "ADMIN"


class User(BaseModel):
    id: UUID4
    username: str
    role: Role
    is_active: bool
    created_at: datetime


class AccessToken(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
