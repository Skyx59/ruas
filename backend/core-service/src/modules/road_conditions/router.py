from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import UUID4

from src.middleware.errors import ErrorResponse
from src.modules.identity.dependencies import CurrentUser, require_roles
from src.modules.identity.models import Role

from .models import ReportCreate, ReportPage, ReportVerification, RoadReport
from .repository import ReportRepository

router = APIRouter(prefix="/road-reports", tags=["Road reports (provisional)"])


def get_repository(request: Request) -> ReportRepository:
    return request.app.state.report_repository


Reports = Annotated[ReportRepository, Depends(get_repository)]


@router.post(
    "",
    status_code=201,
    dependencies=[Depends(require_roles(Role.USER, Role.ADMIN))],
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        201: {
            "headers": {
                "Location": {
                    "schema": {"type": "string"},
                    "description": "Path of the created report",
                }
            }
        }
    },
)
def create_report(payload: ReportCreate, response: Response, repository: Reports, user: CurrentUser) -> RoadReport:
    report = repository.create(payload, user.id)
    response.headers["Location"] = f"/api/road-reports/{report.id}"
    return report


@router.get("")
def list_reports(
    repository: Reports,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0, le=2_147_483_647)] = 0,
) -> ReportPage:
    return ReportPage(items=repository.list(limit, offset), limit=limit, offset=offset)


@router.get("/mine", responses={401: {"model": ErrorResponse}})
def list_my_reports(
    repository: Reports,
    user: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0, le=2_147_483_647)] = 0,
) -> ReportPage:
    return ReportPage(items=repository.list(limit, offset, user.id), limit=limit, offset=offset)


@router.get("/{report_id}", responses={404: {"model": ErrorResponse}})
def get_report(report_id: UUID4, repository: Reports) -> RoadReport:
    report = repository.get(report_id)
    if report is None:
        raise HTTPException(404, "Road report not found.")
    return report


@router.patch(
    "/{report_id}/verification",
    summary="Verify or reject a report (ADMIN, provisional)",
    dependencies=[Depends(require_roles(Role.ADMIN))],
    responses={status: {"model": ErrorResponse} for status in (401, 403, 404)},
)
def verify_report(
    report_id: UUID4, payload: ReportVerification, repository: Reports, user: CurrentUser
) -> RoadReport:
    if repository.is_owner(report_id, user.id):
        raise HTTPException(403, "You cannot verify your own report.")
    report = repository.set_verification(report_id, payload.verification_status, user.id)
    if report is None:
        raise HTTPException(404, "Road report not found.")
    return report
