from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from conftest import DEMO_PASSWORD
from src.config.database import connection_to
from src.config.settings import Settings
from src.main import create_app
from src.modules.identity.models import Role
from src.modules.identity.rate_limit import LoginLimiter
from src.modules.identity.security import AUDIENCE, ISSUER

REPORTS = "/api/road-reports"
TOKEN = "/api/auth/token"
ME = "/api/auth/me"
SAMPLE = {"latitude": -6.89, "longitude": 107.61, "description": "Laporan uji"}


@pytest.mark.parametrize("role", [Role.USER, Role.ADMIN])
def test_login_and_me(anonymous, make_user, role):
    user = make_user(role=role)
    response = anonymous.post(
        TOKEN, data={"grant_type": "password", "username": user.username, "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    token = response.json()
    assert token["token_type"] == "bearer"
    assert token["expires_in"] == 1800

    response = anonymous.get(ME, headers={"Authorization": f"Bearer {token['access_token']}"})
    assert response.status_code == 200
    assert response.json() == user.model_dump(mode="json")
    assert "password_hash" not in response.json()


def test_failed_login_is_identical_for_wrong_password_unknown_and_inactive(
    anonymous, make_user, settings
):
    make_user()
    inactive = make_user("demo.inactive")
    with connection_to(settings.db_path) as connection:
        connection.execute("UPDATE users SET is_active = 0 WHERE id = ?", (str(inactive.id),))
        stored = connection.execute(
            "SELECT password_hash FROM users WHERE id = ?", (str(inactive.id),)
        ).fetchone()[0]
    assert stored.startswith("$argon2id$")
    assert DEMO_PASSWORD not in stored

    responses = [
        anonymous.post(TOKEN, data={"username": username, "password": password})
        for username, password in [
            ("demo.user", "wrong-password"),
            ("missing", DEMO_PASSWORD),
            (inactive.username, DEMO_PASSWORD),
        ]
    ]
    for response in responses:
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"
        assert response.json() == responses[0].json()


@pytest.mark.parametrize(
    "case", ["malformed", "expired", "signature", "audience", "issuer", "missing_exp", "use"]
)
def test_invalid_token_is_rejected(anonymous, make_user, jwt_secret, case):
    user = make_user()
    now = datetime.now(UTC)
    claims = {
        "sub": str(user.id),
        "iat": now - timedelta(hours=1),
        "exp": now + timedelta(minutes=5),
        "iss": ISSUER,
        "aud": AUDIENCE,
        "token_use": "access",
    }
    key = bytes.fromhex(jwt_secret)
    match case:
        case "expired":
            claims["exp"] = now - timedelta(seconds=1)
        case "signature":
            key = bytes(reversed(key))
        case "audience":
            claims["aud"] = "other-api"
        case "issuer":
            claims["iss"] = "other-issuer"
        case "missing_exp":
            del claims["exp"]
        case "use":
            claims["token_use"] = "refresh"

    token = "invalid" if case == "malformed" else jwt.encode(claims, key, algorithm="HS256")
    assert anonymous.get(ME, headers={"Authorization": f"Bearer {token}"}).status_code == 401


@pytest.mark.parametrize("account_change", ["disabled", "removed"])
def test_issued_token_is_rejected_when_account_is_no_longer_active(
    anonymous, make_user, authenticate, settings, account_change
):
    user = make_user()
    headers = authenticate(anonymous)
    with connection_to(settings.db_path) as connection:
        if account_change == "disabled":
            connection.execute("UPDATE users SET is_active = 0 WHERE id = ?", (str(user.id),))
        else:
            connection.execute("DELETE FROM users WHERE id = ?", (str(user.id),))
    assert anonymous.get(ME, headers=headers).status_code == 401


def test_missing_token_and_client_identity_headers(anonymous):
    fake_identity = {"X-User-ID": str(uuid4()), "X-Role": "ADMIN"}
    for response in [
        anonymous.get(ME),
        anonymous.post(REPORTS, json=SAMPLE, headers=fake_identity),
        anonymous.patch(
            f"{REPORTS}/{uuid4()}/verification", json={"verification_status": "verified"}
        ),
    ]:
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"


def test_role_cannot_be_set_in_login_or_report_request(anonymous, make_user):
    make_user()
    token = anonymous.post(
        TOKEN, data={"username": "demo.user", "password": DEMO_PASSWORD, "role": "ADMIN"}
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "X-Role": "ADMIN"}
    assert anonymous.get(ME, headers=headers).json()["role"] == "USER"
    assert anonymous.post(REPORTS, headers=headers, json={**SAMPLE, "role": "ADMIN"}).status_code == 422
    assert anonymous.post(
        REPORTS, headers=headers, json={**SAMPLE, "verification_status": "verified"}
    ).status_code == 422
    assert anonymous.patch(
        f"{REPORTS}/{uuid4()}/verification", headers=headers, json={"verification_status": "verified"}
    ).status_code == 403


def test_rbac_admin_verification_public_reads_and_restart(
    anonymous, make_user, authenticate, settings
):
    make_user()
    make_user("demo.admin", Role.ADMIN)
    user_headers = authenticate(anonymous)
    admin_headers = authenticate(anonymous, "demo.admin")

    created = anonymous.post(REPORTS, headers=user_headers, json=SAMPLE)
    assert created.status_code == 201
    assert created.json()["verification_status"] == "pending"
    detail_path = created.headers["location"]
    verification_path = f"{detail_path}/verification"
    assert anonymous.patch(
        verification_path, headers=user_headers, json={"verification_status": "verified"}
    ).status_code == 403
    assert anonymous.get(detail_path).json()["verification_status"] == "pending"

    assert anonymous.post(REPORTS, headers=admin_headers, json=SAMPLE).status_code == 201
    for status in ["verified", "rejected"]:
        response = anonymous.patch(
            verification_path, headers=admin_headers, json={"verification_status": status}
        )
        assert response.status_code == 200
        assert response.json()["verification_status"] == status
    assert anonymous.patch(
        verification_path, headers=admin_headers, json={"verification_status": "pending"}
    ).status_code == 422
    assert anonymous.patch(
        f"{REPORTS}/{uuid4()}/verification",
        headers=admin_headers, json={"verification_status": "verified"},
    ).status_code == 404

    with TestClient(create_app(settings)) as restarted:
        assert restarted.get("/api/health").status_code == 200
        assert restarted.get(detail_path).json()["verification_status"] == "rejected"
        assert len(restarted.get(REPORTS).json()["items"]) == 2
        assert restarted.get(ME, headers=user_headers).json()["role"] == "USER"
        assert restarted.get(ME, headers=authenticate(restarted, "demo.admin")).json()["role"] == "ADMIN"


def test_role_is_loaded_from_database_for_each_request(anonymous, make_user, authenticate, settings):
    user = make_user("demo.admin", Role.ADMIN)
    headers = authenticate(anonymous, user.username)
    with connection_to(settings.db_path) as connection:
        connection.execute("UPDATE users SET role = ? WHERE id = ?", ("USER", str(user.id)))
    assert anonymous.get(ME, headers=headers).json()["role"] == "USER"
    assert anonymous.patch(
        f"{REPORTS}/{uuid4()}/verification", headers=headers, json={"verification_status": "verified"}
    ).status_code == 403


def test_openapi_oauth2_protects_only_required_operations(anonymous):
    spec = anonymous.get("/api/openapi.json").json()
    scheme = spec["components"]["securitySchemes"]["RuasOAuth2"]
    assert scheme["type"] == "oauth2"
    assert scheme["flows"]["password"]["tokenUrl"] == TOKEN
    paths = spec["paths"]
    assert "application/x-www-form-urlencoded" in paths[TOKEN]["post"]["requestBody"]["content"]

    patch = paths[f"{REPORTS}/{{report_id}}/verification"]["patch"]
    for operation in [paths[ME]["get"], paths[REPORTS]["post"], patch]:
        assert operation["security"] == [{"RuasOAuth2": []}]
    assert "403" in patch["responses"]
    for operation in [
        paths["/api/health"]["get"], paths[TOKEN]["post"], paths[REPORTS]["get"],
        paths[f"{REPORTS}/{{report_id}}"]["get"],
    ]:
        assert "security" not in operation


def test_login_rate_limit_is_shared_across_usernames_and_untrusted_headers(anonymous, monkeypatch):
    from src.modules.identity import rate_limit

    now = [100.0]
    monkeypatch.setattr(rate_limit, "monotonic", lambda: now[0])
    for index in range(20):
        response = anonymous.post(
            TOKEN, data={"username": f"unknown{index}", "password": DEMO_PASSWORD}
        )
        assert response.status_code == 401

    response = anonymous.post(
        TOKEN, data={"username": "different", "password": DEMO_PASSWORD},
        headers={"CF-Connecting-IP": "192.0.2.1"},
    )
    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"
    now[0] += 60
    assert anonymous.post(TOKEN, data={"username": "different", "password": DEMO_PASSWORD}).status_code == 401


def test_missing_or_weak_secret_fails_without_echoing_value(monkeypatch):
    monkeypatch.delenv("RUAS_JWT_SECRET", raising=False)
    with pytest.raises(ValidationError, match="RUAS_JWT_SECRET"):
        Settings.from_environment()
    for bad_secret in ["test-invalid-secret", "a" * 64]:
        monkeypatch.setenv("RUAS_JWT_SECRET", bad_secret)
        with pytest.raises(ValidationError, match="RUAS_JWT_SECRET") as exc:
            Settings.from_environment()
        assert bad_secret not in str(exc.value)


def test_login_limiter_bounds_and_releases_parallel_hash_slots():
    limiter = LoginLimiter()
    with limiter.attempt():
        with limiter.attempt():
            with pytest.raises(HTTPException) as full, limiter.attempt():
                pytest.fail("A third parallel attempt was admitted")
            assert full.value.status_code == 429
            assert full.value.headers == {"Retry-After": "1"}
        with limiter.attempt():
            pass
