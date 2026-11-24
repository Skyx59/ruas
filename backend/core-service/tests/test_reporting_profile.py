import pytest
from fastapi.testclient import TestClient

from src.config.database import connection_to, initialize_database
from src.main import create_app
from src.modules.identity.models import Role

REPORTS = "/api/road-reports"
PROFILE = "/api/auth/me/profile"
SAMPLE = {"latitude": -6.89, "longitude": 107.61, "description": "Kondisi jalan uji"}


@pytest.mark.parametrize(
    ("incident_type", "severity"),
    [("flood", "low"), ("traffic", "medium"), ("obstacle", "high")],
)
def test_report_metadata_round_trip_and_private_owner(client, settings, incident_type, severity):
    payload = {**SAMPLE, "incident_type": incident_type, "severity": severity, "location_label": "Jl. Dago"}
    created = client.post(REPORTS, json=payload)
    assert created.status_code == 201
    report = created.json()
    assert report["verification_status"] == "pending"
    assert all(report[key] == value for key, value in payload.items())
    assert "owner_id" not in report
    with TestClient(create_app(settings)) as restarted:
        stored = restarted.get(created.headers["location"]).json()
        assert stored == report
    mine = client.get(f"{REPORTS}/mine").json()["items"]
    assert mine == [report]
    with connection_to(settings.db_path) as connection:
        owner = connection.execute("SELECT owner_id FROM road_reports WHERE id = ?", (report["id"],)).fetchone()[0]
    assert owner == client.get("/api/auth/me").json()["id"]


@pytest.mark.parametrize("field,value", [("incident_type", "earthquake"), ("severity", "critical"), ("location_label", " "), ("owner_id", "forged-owner")])
def test_invalid_metadata_and_forged_owner_rejected(client, field, value):
    assert client.post(REPORTS, json={**SAMPLE, field: value}).status_code == 422
    assert client.get(REPORTS).json()["items"] == []


def test_private_history_and_statistics_are_scoped_to_current_user(anonymous, make_user, authenticate):
    first = make_user("first.user")
    second = make_user("second.user")
    make_user("review.admin", Role.ADMIN)
    first_auth = authenticate(anonymous, first.username)
    second_auth = authenticate(anonymous, second.username)
    admin_auth = authenticate(anonymous, "review.admin")
    own = [anonymous.post(REPORTS, json=SAMPLE, headers=first_auth).json() for _ in range(2)]
    other = anonymous.post(REPORTS, json=SAMPLE, headers=second_auth).json()
    assert anonymous.patch(f"{REPORTS}/{own[0]['id']}/verification", headers=admin_auth, json={"verification_status": "verified"}).status_code == 200
    for headers, ids, verified in [(first_auth, {item["id"] for item in own}, 1), (second_auth, {other["id"]}, 0)]:
        response = anonymous.get(f"{REPORTS}/mine", headers=headers, params={"owner_id": str(first.id)})
        assert response.status_code == 200
        assert {item["id"] for item in response.json()["items"]} == ids
        profile = anonymous.get(PROFILE, headers=headers).json()
        assert profile["statistics"] == {"reports": len(ids), "verified": verified, "confirmations": None}
        assert "password_hash" not in profile["account"]
    assert anonymous.get(PROFILE).status_code == 401
    assert anonymous.get(f"{REPORTS}/mine").status_code == 401
    assert all("owner_id" not in report for report in anonymous.get(REPORTS).json()["items"])


def test_admin_cannot_verify_or_reject_own_report(anonymous, make_user, authenticate):
    make_user("self.admin", Role.ADMIN)
    headers = authenticate(anonymous, "self.admin")
    created = anonymous.post(REPORTS, json=SAMPLE, headers=headers).json()
    for status in ["verified", "rejected"]:
        response = anonymous.patch(f"{REPORTS}/{created['id']}/verification", headers=headers, json={"verification_status": status})
        assert response.status_code == 403
    assert anonymous.get(f"{REPORTS}/{created['id']}").json()["verification_status"] == "pending"


def test_history_pagination_and_empty_statistics(client):
    profile = client.get(PROFILE).json()
    assert profile["statistics"] == {"reports": 0, "verified": 0, "confirmations": None}
    created = [client.post(REPORTS, json=SAMPLE).json() for _ in range(3)]
    page = client.get(f"{REPORTS}/mine", params={"limit": 1, "offset": 1})
    assert page.status_code == 200
    assert page.json()["items"][0]["id"] == created[1]["id"]
    assert client.get(f"{REPORTS}/mine", params={"limit": 101}).status_code == 422
    assert client.get(f"{REPORTS}/mine", params={"offset": -1}).status_code == 422


def test_legacy_rows_remain_unowned_after_additive_migration(client, settings):
    from uuid import uuid4
    legacy_id = str(uuid4())
    with connection_to(settings.db_path) as connection:
        connection.execute("INSERT INTO road_reports (id, latitude, longitude, description, created_at) VALUES (?, ?, ?, ?, ?)", (legacy_id, -6.9, 107.6, "Laporan lama", "2026-11-23T00:00:00+00:00"))
    initialize_database(settings.db_path)
    assert client.get(f"{REPORTS}/{legacy_id}").json()["incident_type"] is None
    assert client.get(f"{REPORTS}/mine").json()["items"] == []
    assert client.get(PROFILE).json()["statistics"]["reports"] == 0
