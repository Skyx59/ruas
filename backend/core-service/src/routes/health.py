import logging
import sqlite3
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from src.middleware.errors import ErrorResponse

logger = logging.getLogger("ruas")
router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


@router.get("/health", responses={503: {"model": ErrorResponse}})
def health(request: Request) -> HealthResponse:
    try:
        request.app.state.report_repository.check_readable()
    except sqlite3.Error as exc:
        logger.warning("SQLite readiness check failed (%s)", type(exc).__name__)
        raise HTTPException(503, "Report storage is unavailable.") from exc
    return HealthResponse()
