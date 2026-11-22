import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from .models import AccessToken

TOKEN_TTL = timedelta(minutes=30)
ISSUER = "ruas-core"
AUDIENCE = "ruas-api"
ALGORITHM = "HS256"
PASSWORD_HASHER = PasswordHasher(time_cost=2, memory_cost=19 * 1024, parallelism=1)


class IdentitySecurity:
    def __init__(self, key: bytes) -> None:
        self._key = key
        # Keep unknown-account and inactive-account checks on the same hashing path.
        self._dummy_hash = PASSWORD_HASHER.hash(secrets.token_urlsafe(32))

    def check_password(self, password: str, password_hash: str | None) -> bool:
        try:
            return PASSWORD_HASHER.verify(password_hash or self._dummy_hash, password)
        except (InvalidHashError, VerificationError):
            return False

    def issue(self, user_id: UUID) -> AccessToken:
        now = datetime.now(UTC)
        encoded = jwt.encode(
            {
                "sub": str(user_id),
                "iat": now,
                "exp": now + TOKEN_TTL,
                "iss": ISSUER,
                "aud": AUDIENCE,
                "token_use": "access",
            },
            self._key,
            algorithm=ALGORITHM,
        )
        return AccessToken(access_token=encoded, expires_in=int(TOKEN_TTL.total_seconds()))

    def subject(self, token: str) -> UUID:
        payload = jwt.decode(
            token,
            self._key,
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            audience=AUDIENCE,
            options={
                "require": ["sub", "iat", "exp", "iss", "aud", "token_use"],
                "strict_aud": True,
            },
        )
        user_id = UUID(payload["sub"])
        if user_id.version != 4 or payload["token_use"] != "access":
            raise ValueError("Invalid access token subject or use.")
        return user_id
