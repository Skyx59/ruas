from uuid import uuid4

from fastapi.testclient import TestClient

from src.config.database import connection_to, initialize_database
from src.main import create_app

INSERT_LEGACY_REPORT = """
INSERT INTO road_reports (id, latitude, longitude, description, created_at)
VALUES (?, ?, ?, ?, ?)
"""


def test_additive_migration_preserves_legacy_rows_and_accepts_legacy_writes(settings):
    settings.db_path.parent.mkdir()
    first_id, second_id = str(uuid4()), str(uuid4())
    original = (first_id, -6.89, 107.61, "Laporan lama", "2026-11-23T05:00:00.000000+00:00")
    with connection_to(settings.db_path) as connection:
        connection.execute(
            """
            CREATE TABLE road_reports (
                id TEXT PRIMARY KEY NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                description TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(INSERT_LEGACY_REPORT, original)

    initialize_database(settings.db_path)
    with TestClient(create_app(settings)) as client:
        path = f"/api/road-reports/{first_id}"
        assert client.get(path).json()["verification_status"] == "pending"
        with connection_to(settings.db_path) as connection:
            row = connection.execute("SELECT * FROM road_reports WHERE id = ?", (first_id,)).fetchone()
            assert tuple(row)[:6] == (*original, "pending")
            assert row["incident_type"] is None
            assert row["severity"] is None
            assert row["location_label"] is None
            assert row["owner_id"] is None
            connection.execute(INSERT_LEGACY_REPORT, (second_id, *original[1:]))
            connection.execute(
                "UPDATE road_reports SET verification_status = ? WHERE id = ?", ("verified", first_id)
            )
            assert connection.execute("PRAGMA quick_check").fetchone()[0] == "ok"
        initialize_database(settings.db_path)
        assert client.get(path).json()["verification_status"] == "verified"
        assert client.get(f"/api/road-reports/{second_id}").json()["verification_status"] == "pending"
