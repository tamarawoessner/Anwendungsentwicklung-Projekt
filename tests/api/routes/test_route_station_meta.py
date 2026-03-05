from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app


class FakeConn:
    def close(self):
        pass


def test_station_meta_happy_path_200():
    client = TestClient(app)

    with patch("app.api.routes.station_meta.connect_to_db", return_value=FakeConn()), \
         patch("app.api.routes.station_meta.get_station_meta") as m_service:

        # Minimaler Response passend zu StationMetaResponse
        m_service.return_value = {
            "station": {"station_id": "X", "name": "N", "lat": 1.0, "lon": 2.0},
            "availability": {"start_year": 1900, "end_year": 2000},
        }

        r = client.get("/stations/X/meta")
        assert r.status_code == 200


def test_station_meta_returns_404_when_station_and_availability_none():
    client = TestClient(app)

    with patch("app.api.routes.station_meta.connect_to_db", return_value=FakeConn()), \
         patch("app.api.routes.station_meta.get_station_meta", return_value={"station": None, "availability": None}):

        r = client.get("/stations/UNKNOWN/meta")
        assert r.status_code == 404
        assert r.json()["detail"] == "Station not found"


def test_station_meta_returns_400_on_value_error():
    client = TestClient(app)

    with patch("app.api.routes.station_meta.connect_to_db", return_value=FakeConn()), \
         patch("app.api.routes.station_meta.get_station_meta", side_effect=ValueError("station_id is required")):

        r = client.get("/stations/%20%20/meta")  # "  "
        assert r.status_code == 400
        assert "station_id is required" in r.text