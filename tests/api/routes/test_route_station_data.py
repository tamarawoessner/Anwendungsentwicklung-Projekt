from fastapi.testclient import TestClient
from unittest.mock import patch
from psycopg import Error as PsycopgError
from app.main import app


def test_station_data_happy_path():
    client = TestClient(app)

    # Fake DB connection with close()
    class FakeConn:
        def close(self):
            pass

    with patch("app.api.routes.station_data.connect_to_db", return_value=FakeConn()) as m_conn, \
         patch("app.api.routes.station_data.get_station_data") as m_service:

        # Minimaler Response, passend zu StationDataResponse:
        # Da ich euer Pydantic Schema nicht sehe, bauen wir etwas,
        # das sehr wahrscheinlich passt (station, request, year, seasons).
        m_service.return_value = {
            "station": {"station_id": "X", "name": "N", "lat": 1.0, "lon": 2.0},
            "availability": {"start_year": 1900, "end_year": 2000},
            "request": {"station_id": "X", "start_year": 2000, "end_year": 2001},
            "year": {"element": "BOTH", "data": []},
            "seasons": {},
        }

        r = client.post(
            "/stations/X/data?start_year=2000&end_year=2001",
            json={"selection": {"year": "BOTH"}},
        )

        assert r.status_code == 200

        m_conn.assert_called_once()
        m_service.assert_called_once()


def test_station_data_returns_400_on_value_error():
    client = TestClient(app)

    class FakeConn:
        def close(self):
            pass

    with patch("app.api.routes.station_data.connect_to_db", return_value=FakeConn()), \
         patch("app.api.routes.station_data.get_station_data", side_effect=ValueError("bad input")):

        r = client.post(
            "/stations/X/data?start_year=2001&end_year=2000",
            json={"selection": {"year": "BOTH"}},
        )
        assert r.status_code == 400
        assert "bad input" in r.text

def test_station_data_db_error_500():
    client = TestClient(app)

    class FakeConn:
        def close(self): 
            pass

    with patch("app.api.routes.station_data.connect_to_db", return_value=FakeConn()), \
         patch("app.api.routes.station_data.get_station_data", side_effect=PsycopgError()):
        r = client.post(
            "/stations/X/data?start_year=2000&end_year=2001",
            json={"selection": {"year": "BOTH"}}
        )
        assert r.status_code == 500
        assert r.json()["detail"] == "Database error"