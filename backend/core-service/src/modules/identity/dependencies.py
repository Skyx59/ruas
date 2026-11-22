from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError

from .models import Role, User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/token", scheme_name="RuasOAuth2", auto_error=False
)


def unauthorized(message: str = "A valid access token is required.") -> HTTPException:
    return HTTPException(401, message, headers={"WWW-Authenticate": "Bearer"})


def get_current_user(request: Request, token: Annotated[str | None, Depends(oauth2_scheme)]) -> User:
    if not token:
        raise unauthorized()
    try:
        user_id = request.app.state.identity_security.subject(token)
    except (InvalidTokenError, ValueError):
        raise unauthorized() from None

    user = request.app.state.user_repository.find_user(user_id)
    if user is None or not user.is_active:
        raise unauthorized()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: Role) -> Callable[[User], None]:
    def authorize(user: CurrentUser) -> None:
        if user.role not in roles:
            raise HTTPException(403, "Your role does not permit this action.")

    return authorize
