import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException

logger = logging.getLogger("ruas")


class FieldIssue(BaseModel):
    field: list[str | int]
    message: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    issues: list[FieldIssue] | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


def error_response(
    status: int,
    code: str,
    message: str,
    *,
    issues: list[FieldIssue] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    payload = ErrorResponse(error=ErrorDetail(code=code, message=message, issues=issues))
    return JSONResponse(payload.model_dump(exclude_none=True), status, headers=headers)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, exc: RequestValidationError) -> JSONResponse:
        issues = [
            FieldIssue(field=list(issue["loc"]), message=issue["msg"])
            for issue in exc.errors()
        ]
        return error_response(
            422, "validation_error", "Request validation failed.", issues=issues
        )

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
        status = HTTPStatus(exc.status_code)
        message = exc.detail if isinstance(exc.detail, str) else status.phrase
        return error_response(
            status, status.name.lower(), message, headers=exc.headers
        )

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unexpected API error (%s)", type(exc).__name__)
        return error_response(500, "internal_error", "An unexpected error occurred.")
