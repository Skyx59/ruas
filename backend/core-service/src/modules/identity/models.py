from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import UUID4, BaseModel, Field


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


class ContributionStatistics(BaseModel):
    reports: int = Field(ge=0)
    verified: int = Field(ge=0)
    confirmations: int | None = None


class UserProfile(BaseModel):
    account: User
    statistics: ContributionStatistics
