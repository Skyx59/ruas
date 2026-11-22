import sqlite3
from contextlib import closing
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from src.config.settings import Settings
from src.main import create_app

REPORTS = "/api/road-reports"
SAMPLE = {"latitude": -6.89, "longitude": 107.61, "description": "Genangan di tepi jalan"}


@pytest.fixture
def settings(tmp_path):
    return Settings(db_path=tmp_path / "data" / "ruas.sqlite3")


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings)) as client:
        yield client


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_read_and_persist_across_app_instances(settings):
    with TestClient(create_app(settings)) as client:
        response = client.post(REPORTS, json=SAMPLE)
        assert response.status_code == 201
        report = response.json()
        assert {key: report[key] for key in SAMPLE} == SAMPLE
        assert UUID(report["id"]).version == 4
        assert datetime.fromisoformat(report["created_at"]).tzinfo == UTC
        assert response.headers["Location"] == f"{REPORTS}/{report['id']}"

    with TestClient(create_app(settings)) as client:
        stored = client.get(response.headers["Location"])
        assert stored.status_code == 200
        assert stored.json() == report
        assert client.get(REPORTS).json() == {"items": [report], "limit": 20, "offset": 0}


def test_list_empty_and_paginated_newest_first(client):
    assert client.get(REPORTS).json() == {"items": [], "limit": 20, "offset": 0}
    first = client.post(REPORTS, json=SAMPLE).json()
    second = client.post(REPORTS, json={**SAMPLE, "description": "  Jalan berlubang  "}).json()
    assert second["description"] == "Jalan berlubang"
    assert client.get(REPORTS, params={"limit": 1}).json() == {
        "items": [second], "limit": 1, "offset": 0
    }
    assert client.get(REPORTS, params={"limit": 1, "offset": 1}).json() == {
        "items": [first], "limit": 1, "offset": 1
    }


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({**SAMPLE, "latitude": 91}, "latitude"),
        ({**SAMPLE, "longitude": -181}, "longitude"),
        ({**SAMPLE, "latitude": "-6.89"}, "latitude"),
        ({**SAMPLE, "longitude": True}, "longitude"),
        ({**SAMPLE, "description": "    "}, "description"),
        ({**SAMPLE, "description": "a" * 501}, "description"),
        ({"latitude": 0, "longitude": 0}, "description"),
        ({**SAMPLE, "unexpected": "field"}, "unexpected"),
    ],
)
def test_invalid_reports_are_rejected(client, payload, field):
    response = client.post(REPORTS, json=payload)
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert ["body", field] in [issue["field"] for issue in error["issues"]]
    assert client.get(REPORTS).json()["items"] == []


def test_boundary_coordinates_are_accepted(client):
    response = client.post(REPORTS, json={**SAMPLE, "latitude": -90, "longitude": 180})
    assert response.status_code == 201


def test_bad_json_has_standard_error(client):
    response = client.post(
        REPORTS, content='{"latitude":', headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


@pytest.mark.parametrize("params", [{"limit": 101}, {"offset": -1}, {"offset": 2**63}])
def test_invalid_pagination(client, params):
    response = client.get(REPORTS, params=params)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_invalid_and_missing_ids(client):
    invalid_id = client.get(f"{REPORTS}/invalid")
    missing_report = client.get(f"{REPORTS}/{uuid4()}")
    assert invalid_id.status_code == 422
    assert missing_report.status_code == 404
    assert missing_report.json() == {
        "error": {"code": "not_found", "message": "Road report not found."}
    }


def test_unsupported_method_preserves_allow_header(client):
    response = client.put(REPORTS, json=SAMPLE)
    assert response.status_code == 405
    assert "allow" in response.headers
    assert response.json()["error"]["code"] == "method_not_allowed"


def test_storage_failure_returns_safe_errors(settings):
    with TestClient(create_app(settings), raise_server_exceptions=False) as client:
        with closing(sqlite3.connect(settings.db_path)) as connection:
            connection.execute("DROP TABLE road_reports")

        health = client.get("/api/health")
        reports = client.get(REPORTS)
        assert health.status_code == 503
        assert health.json()["error"]["code"] == "service_unavailable"
        assert reports.status_code == 500
        assert reports.json() == {
            "error": {"code": "internal_error", "message": "An unexpected error occurred."}
        }


def test_openapi_describes_api_and_validation_response(client):
    response = client.get("/api/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert set(paths) == {"/api/health", REPORTS, f"{REPORTS}/{{report_id}}"}
    schema = paths[REPORTS]["post"]["responses"]["422"]["content"]["application/json"]["schema"]
    assert schema["$ref"] == "#/components/schemas/ErrorResponse"
    assert "/api/openapi.json" in client.get("/api/docs").text


def test_environment_settings(monkeypatch, tmp_path):
    db_path = tmp_path / "reports.sqlite3"
    monkeypatch.setenv("RUAS_DB_PATH", str(db_path))
    monkeypatch.setenv("RUAS_LOG_LEVEL", "warning")

    assert Settings.from_environment() == Settings(db_path=db_path, log_level="WARNING")
    with TestClient(create_app()) as client:
        assert client.get("/api/health").status_code == 200
    assert db_path.is_file()
