from fastapi.testclient import TestClient
from unittest.mock import patch
from psycopg import Error as PsycopgError

from app.main import app


class FakeConn:
    def close(self):
        pass


def test_stations_search_happy_path_200():
    client = TestClient(app)

    with patch("app.api.routes.stations_search.connect_to_db", return_value=FakeConn()), \
         patch("app.api.routes.stations_search.find_nearby_stations") as m_service:

        m_service.return_value = [
            {
                "station_id": "A",
                "lat": 0.0,
                "lon": 0.0,
                "distance_km": 0.0,
                "start_year": 1900,
                "end_year": 2000,
            },
            {
                "station_id": "B",
                "lat": 0.0,
                "lon": 1.0,
                "distance_km": 111.0,
                "start_year": 1950,
                "end_year": 1999,
            },
        ]

        body = {"lat": 0.0, "lon": 0.0, "radius_km": 50, "limit": 10}
        r = client.post("/stations/search", json=body)

        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 2
        assert len(data["stations"]) == 2
        assert data["stations"][0]["station_id"] == "A"


def test_stations_search_validation_error_422():
    client = TestClient(app)

    # lat fehlt -> Request Schema sollte 422 erzeugen
    body = {"lon": 0.0, "radius_km": 50, "limit": 10}
    r = client.post("/stations/search", json=body)
    assert r.status_code == 422


def test_stations_search_db_error_500():
    client = TestClient(app)

    with patch("app.api.routes.stations_search.connect_to_db", return_value=FakeConn()), \
         patch("app.api.routes.stations_search.find_nearby_stations", side_effect=PsycopgError()):

        body = {"lat": 0.0, "lon": 0.0, "radius_km": 50, "limit": 10}
        r = client.post("/stations/search", json=body)

        assert r.status_code == 500
        assert r.json()["detail"] == "Database error"