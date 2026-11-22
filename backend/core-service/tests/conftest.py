import secrets

import pytest
from fastapi.testclient import TestClient

from src.config.settings import Settings
from src.main import create_app
from src.modules.identity.models import Role
from src.modules.identity.repository import UserRepository
from src.modules.identity.security import PASSWORD_HASHER

DEMO_PASSWORD = secrets.token_urlsafe(18)


@pytest.fixture
def jwt_secret():
    return secrets.token_hex(32)


@pytest.fixture
def settings(tmp_path, jwt_secret):
    return Settings(db_path=tmp_path / "data" / "ruas.sqlite3", jwt_secret=jwt_secret)


@pytest.fixture
def anonymous(settings):
    with TestClient(create_app(settings)) as client:
        yield client


@pytest.fixture
def make_user(settings):
    def create(username="demo.user", role=Role.USER, password=DEMO_PASSWORD):
        return UserRepository(settings.db_path).create(
            username, PASSWORD_HASHER.hash(password), role
        )

    return create


@pytest.fixture
def authenticate():
    def login(client, username="demo.user", password=DEMO_PASSWORD):
        response = client.post(
            "/api/auth/token", data={"username": username, "password": password}
        )
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return login


@pytest.fixture
def client(anonymous, make_user, authenticate):
    make_user()
    anonymous.headers.update(authenticate(anonymous))
    return anonymous
