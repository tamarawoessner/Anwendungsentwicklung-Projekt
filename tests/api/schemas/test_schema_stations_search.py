import pytest
from pydantic import ValidationError

from app.api.schemas.station_search import StationSearchRequest, StationSearchResponse


def test_station_search_request_defaults():
    req = StationSearchRequest(lat=0.0, lon=0.0)
    assert req.radius_km == 50
    assert req.limit == 50
    assert req.start_year is None
    assert req.end_year is None


def test_station_search_request_rejects_lat_out_of_range():
    with pytest.raises(ValidationError):
        StationSearchRequest(lat=100.0, lon=0.0)


def test_station_search_request_rejects_lon_out_of_range():
    with pytest.raises(ValidationError):
        StationSearchRequest(lat=0.0, lon=200.0)


def test_station_search_request_rejects_non_positive_radius():
    with pytest.raises(ValidationError):
        StationSearchRequest(lat=0.0, lon=0.0, radius_km=0)


def test_station_search_request_rejects_year_range_in_validator():
    with pytest.raises(ValidationError) as exc:
        StationSearchRequest(lat=0.0, lon=0.0, start_year=2020, end_year=2019)
    assert "start_year must be less than or equal to end_year" in str(exc.value)


def test_station_search_response_parses():
    payload = {
        "request": {"lat": 0.0, "lon": 0.0, "radius_km": 50, "limit": 2},
        "count": 1,
        "stations": [
            {
                "station_id": "A",
                "lat": 0.0,
                "lon": 0.0,
                "distance_km": 0.0,
                "start_year": 1900,
                "end_year": 2000,
            }
        ],
    }

    res = StationSearchResponse(**payload)
    assert res.count == 1
    assert res.stations[0].station_id == "A"