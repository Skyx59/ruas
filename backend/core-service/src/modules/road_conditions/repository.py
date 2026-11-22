from datetime import UTC, datetime
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from src.config.database import connection_to

from .models import ReportCreate, RoadReport


class ReportRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path

    def check_readable(self) -> None:
        with connection_to(self.db_path) as connection:
            connection.execute("SELECT 1 FROM road_reports LIMIT 1").fetchone()

    def create(self, payload: ReportCreate) -> RoadReport:
        report = RoadReport(
            id=uuid4(), created_at=datetime.now(UTC), verification_status="pending",
            **payload.model_dump(),
        )
        with connection_to(self.db_path) as connection:
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
        with connection_to(self.db_path) as connection:
            row = connection.execute(
                """
                SELECT id, latitude, longitude, description, created_at, verification_status
                FROM road_reports WHERE id = ?
                """,
                (str(report_id),),
            ).fetchone()
        return RoadReport.model_validate(dict(row)) if row is not None else None

    def list(self, limit: int, offset: int) -> list[RoadReport]:
        with connection_to(self.db_path) as connection:
            rows = connection.execute(
                """
                SELECT id, latitude, longitude, description, created_at, verification_status
                FROM road_reports ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?
                """,
                (limit, offset),
            ).fetchall()
        return [RoadReport.model_validate(dict(row)) for row in rows]

    def set_verification(
        self, report_id: UUID, status: Literal["verified", "rejected"]
    ) -> RoadReport | None:
        with connection_to(self.db_path) as connection:
            row = connection.execute(
                """
                UPDATE road_reports SET verification_status = ? WHERE id = ?
                RETURNING id, latitude, longitude, description, created_at, verification_status
                """,
                (status, str(report_id)),
            ).fetchone()
        return RoadReport.model_validate(dict(row)) if row is not None else None
