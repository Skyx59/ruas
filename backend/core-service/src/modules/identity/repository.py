import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from src.config.database import connection_to

from .models import Role, User


class UserRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path

    def create(self, username: str, password_hash: str, role: Role) -> User:
        user = User(id=uuid4(), username=username, role=role, is_active=True, created_at=datetime.now(UTC))
        with connection_to(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO users (id, username, password_hash, role, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (str(user.id), username, password_hash, role.value, 1, user.created_at.isoformat()),
            )
        return user

    def find_credentials(self, username: str) -> sqlite3.Row | None:
        with connection_to(self.db_path) as connection:
            return connection.execute(
                "SELECT id, password_hash, is_active FROM users WHERE username = ?",
                (username,),
            ).fetchone()

    def find_user(self, user_id: UUID) -> User | None:
        with connection_to(self.db_path) as connection:
            row = connection.execute(
                "SELECT id, username, role, is_active, created_at FROM users WHERE id = ?",
                (str(user_id),),
            ).fetchone()
        return User.model_validate(dict(row)) if row is not None else None
