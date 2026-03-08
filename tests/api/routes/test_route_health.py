from fastapi.testclient import TestClient
from unittest.mock import patch
from psycopg import Error as PsycopgError

from app.main import app
from app.api.router import api_router


class FakeConn:
    def close(self):
        pass


def test_health_endpoint_ok():
    client = TestClient(app)

    with patch("app.api.routes.health.connect_to_db", return_value=FakeConn()), patch(
        "app.api.routes.health.get_station_meta",
        return_value={
            "station": {"station_id": "X", "name": "N", "lat": 1.0, "lon": 2.0},
            "availability": {"start_year": 1900, "end_year": 2000},
        },
    ):

        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"
        assert "checked_station_id" in r.json()


def test_health_endpoint_returns_503_when_no_connection():
    client = TestClient(app)

    with patch("app.api.routes.health.connect_to_db", return_value=None):
        r = client.get("/health")
        assert r.status_code == 503
        assert r.json()["detail"] == "Database not ready"


def test_health_endpoint_returns_503_on_psycopg_error():
    client = TestClient(app)

    with patch("app.api.routes.health.connect_to_db", return_value=FakeConn()), patch(
        "app.api.routes.health.get_station_meta", side_effect=PsycopgError()
    ):
        r = client.get("/health")
        assert r.status_code == 503
        assert r.json()["detail"] == "Database not ready"


def test_health_endpoint_returns_503_when_station_not_found():
    client = TestClient(app)

    with patch("app.api.routes.health.connect_to_db", return_value=FakeConn()), patch(
        "app.api.routes.health.get_station_meta",
        return_value={"station": None, "availability": None},
    ):
        r = client.get("/health")
        assert r.status_code == 503
        assert r.json()["detail"] == "Readiness check station not found"


def test_api_router_includes_routes():
    # stellt sicher, dass der router nicht leer ist
    assert len(api_router.routes) > 0
