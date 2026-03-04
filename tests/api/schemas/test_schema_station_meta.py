import pytest
from pydantic import ValidationError

from app.api.schemas.station_meta import StationMetaResponse


def test_station_meta_response_all_none_is_allowed():
    m = StationMetaResponse()
    assert m.station is None
    assert m.availability is None


def test_station_meta_response_parses_station_and_availability():
    payload = {
        "station": {"station_id": "X", "name": "N", "lat": 1.0, "lon": 2.0},
        "availability": {"start_year": 1900, "end_year": 2000},
    }
    m = StationMetaResponse(**payload)
    assert m.station.station_id == "X"
    assert m.availability.start_year == 1900


def test_station_meta_response_rejects_station_without_id():
    payload = {"station": {"name": "N"}}
    with pytest.raises(ValidationError):
        StationMetaResponse(**payload)


def test_station_meta_response_rejects_availability_missing_field():
    payload = {"availability": {"start_year": 1900}}
    with pytest.raises(ValidationError):
        StationMetaResponse(**payload)