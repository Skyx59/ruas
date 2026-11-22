import sqlite3
from collections.abc import Iterator
from contextlib import closing, contextmanager
from pathlib import Path


@contextmanager
def connection_to(path: Path) -> Iterator[sqlite3.Connection]:
    with closing(sqlite3.connect(path, timeout=5)) as connection:
        connection.row_factory = sqlite3.Row
        with connection:
            yield connection


def initialize_database(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with connection_to(path) as connection:
        # Serialize schema inspection and migration across service and CLI starts.
        connection.execute("BEGIN IMMEDIATE")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS road_reports (
                id TEXT PRIMARY KEY NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                description TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS road_reports_recent
            ON road_reports (created_at DESC, id DESC)
            """
        )
        columns = {row["name"] for row in connection.execute("PRAGMA table_info(road_reports)")}
        if "verification_status" not in columns:
            connection.execute(
                """
                ALTER TABLE road_reports
                ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending'
                CHECK (verification_status IN ('pending', 'verified', 'rejected'))
                """
            )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY NOT NULL,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('USER', 'ADMIN')),
                is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
                created_at TEXT NOT NULL
            )
            """
        )
