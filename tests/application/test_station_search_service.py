from unittest.mock import patch
import importlib
import app.application.station_search_service as svc
importlib.reload(svc)


def test_sorts_by_distance_and_applies_limit():
    with patch.object(
        svc,
        "read_location_for_all_stations",
        return_value=[
            {"station_id": "A", "lat": 0.0, "lon": 0.0},
            {"station_id": "B", "lat": 0.0, "lon": 1.0},
        ],
    ), patch.object(
        svc,
        "read_years_for_all_stations",
        return_value=[
            {"station_id": "A", "start_year": 1900, "end_year": 2000},
            {"station_id": "B", "start_year": 1900, "end_year": 2000},
        ],
    ):
        res = svc.find_nearby_stations(conn=None, lat=0.0, lon=0.0, radius_km=10000, limit=1)

    assert len(res) == 1
    assert res[0]["station_id"] == "A"
    assert res[0]["distance_km"] == 0.0