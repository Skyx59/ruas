import sqlite3
from collections.abc import Iterator
from contextlib import closing, contextmanager
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from .models import ReportCreate, RoadReport


class ReportRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        with closing(sqlite3.connect(self.db_path, timeout=5)) as connection:
            connection.row_factory = sqlite3.Row
            with connection:
                yield connection

    def initialize(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connection() as connection:
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

    def check_readable(self) -> None:
        with self._connection() as connection:
            connection.execute("SELECT 1 FROM road_reports LIMIT 1").fetchone()

    def create(self, payload: ReportCreate) -> RoadReport:
        report = RoadReport(id=uuid4(), created_at=datetime.now(UTC), **payload.model_dump())
        with self._connection() as connection:
            connection.execute(
                """
                INSERT INTO road_reports (id, latitude, longitude, description, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    str(report.id),
                    report.latitude,
                    report.longitude,
                    report.description,
                    report.created_at.isoformat(timespec="microseconds"),
                ),
            )
        return report

    def get(self, report_id: UUID) -> RoadReport | None:
        with self._connection() as connection:
            row = connection.execute(
                """
                SELECT id, latitude, longitude, description, created_at
                FROM road_reports WHERE id = ?
                """,
                (str(report_id),),
            ).fetchone()
        return RoadReport.model_validate(dict(row)) if row is not None else None

    def list(self, limit: int, offset: int) -> list[RoadReport]:
        with self._connection() as connection:
            rows = connection.execute(
                """
                SELECT id, latitude, longitude, description, created_at
                FROM road_reports ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?
                """,
                (limit, offset),
            ).fetchall()
        return [RoadReport.model_validate(dict(row)) for row in rows]
