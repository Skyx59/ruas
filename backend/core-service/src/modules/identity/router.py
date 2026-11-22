from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response
from fastapi.security import OAuth2PasswordRequestForm

from src.middleware.errors import ErrorResponse

from .dependencies import CurrentUser, unauthorized
from .models import AccessToken, User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/token",
    responses={status: {"model": ErrorResponse} for status in (401, 422, 429)},
)
def login(
    request: Request,
    response: Response,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> AccessToken:
    state = request.app.state
    with state.login_limiter.attempt():
        credentials = state.user_repository.find_credentials(form.username)
        password_ok = state.identity_security.check_password(
            form.password, credentials["password_hash"] if credentials is not None else None
        )
        if credentials is None or not credentials["is_active"] or not password_ok:
            raise unauthorized("Invalid username or password.")
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
        return state.identity_security.issue(UUID(credentials["id"]))


@router.get("/me", responses={401: {"model": ErrorResponse}})
def me(user: CurrentUser) -> User:
    return user
