from datetime import datetime
from typing import Literal

from pydantic import UUID4, BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    latitude: float = Field(strict=True, ge=-90, le=90)
    longitude: float = Field(strict=True, ge=-180, le=180)
    description: str = Field(min_length=1, max_length=500)


class RoadReport(ReportCreate):
    id: UUID4
    created_at: datetime
    verification_status: Literal["pending", "verified", "rejected"]


class ReportVerification(BaseModel):
    model_config = ConfigDict(extra="forbid")

    verification_status: Literal["verified", "rejected"]


class ReportPage(BaseModel):
    items: list[RoadReport]
    limit: int
    offset: int
