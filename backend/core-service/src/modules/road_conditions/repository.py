from datetime import UTC, datetime
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from src.config.database import connection_to

from .models import ReportCreate, RoadReport

REPORT_COLUMNS = (
    "id, latitude, longitude, description, created_at, verification_status, "
    "incident_type, severity, location_label"
)


class ReportRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path

    def check_readable(self) -> None:
        with connection_to(self.db_path) as connection:
            connection.execute("SELECT 1 FROM road_reports LIMIT 1").fetchone()

    def create(self, payload: ReportCreate, owner_id: UUID) -> RoadReport:
        report = RoadReport(
            id=uuid4(), created_at=datetime.now(UTC), verification_status="pending",
            **payload.model_dump(),
        )
        with connection_to(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO road_reports
                (id, latitude, longitude, description, created_at, incident_type, severity, location_label, owner_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(report.id), report.latitude, report.longitude, report.description,
                    report.created_at.isoformat(timespec="microseconds"),
                    report.incident_type, report.severity, report.location_label, str(owner_id),
                ),
            )
        return report

    def get(self, report_id: UUID) -> RoadReport | None:
        with connection_to(self.db_path) as connection:
            row = connection.execute(
                f"SELECT {REPORT_COLUMNS} FROM road_reports WHERE id = ?", (str(report_id),)
            ).fetchone()
        return RoadReport.model_validate(dict(row)) if row is not None else None

    def list(self, limit: int, offset: int, owner_id: UUID | None = None) -> list[RoadReport]:
        where = " WHERE owner_id = ?" if owner_id is not None else ""
        parameters = (str(owner_id), limit, offset) if owner_id is not None else (limit, offset)
        with connection_to(self.db_path) as connection:
            rows = connection.execute(
                f"SELECT {REPORT_COLUMNS} FROM road_reports{where} "
                "ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?", parameters,
            ).fetchall()
        return [RoadReport.model_validate(dict(row)) for row in rows]

    def statistics_for(self, owner_id: UUID) -> dict[str, int]:
        with connection_to(self.db_path) as connection:
            row = connection.execute(
                "SELECT COUNT(*) AS reports, "
                "COALESCE(SUM(verification_status = 'verified'), 0) AS verified "
                "FROM road_reports WHERE owner_id = ?", (str(owner_id),),
            ).fetchone()
        return dict(row)

    def is_owner(self, report_id: UUID, user_id: UUID) -> bool:
        with connection_to(self.db_path) as connection:
            row = connection.execute(
                "SELECT 1 FROM road_reports WHERE id = ? AND owner_id = ?",
                (str(report_id), str(user_id)),
            ).fetchone()
        return row is not None

    def set_verification(
        self, report_id: UUID, status: Literal["verified", "rejected"], verifier_id: UUID
    ) -> RoadReport | None:
        with connection_to(self.db_path) as connection:
            row = connection.execute(
                "UPDATE road_reports SET verification_status = ? "
                "WHERE id = ? AND (owner_id IS NULL OR owner_id != ?) "
                f"RETURNING {REPORT_COLUMNS}",
                (status, str(report_id), str(verifier_id)),
            ).fetchone()
        return RoadReport.model_validate(dict(row)) if row is not None else None
