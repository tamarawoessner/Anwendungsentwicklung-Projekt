import pytest
from pydantic import ValidationError

from app.api.schemas.station_data import (
    BoolPair,
    ElementSelection,
    SeasonKey,
    StationDataRequest,
    StationDataResponse,
)


def test_station_data_request_accepts_selection_variants():
    # 1) None selection
    r1 = StationDataRequest(selection=None)
    assert r1.selection is None

    # 2) Enum value
    r2 = StationDataRequest(selection={"year": "BOTH"})
    assert r2.selection.year == ElementSelection.BOTH

    # 3) BoolPair dict
    r3 = StationDataRequest(selection={"winter": {"tmin": True}})
    assert isinstance(r3.selection.winter, BoolPair)
    assert r3.selection.winter.tmin is True
    assert r3.selection.winter.tmax is False


def test_station_data_response_parses_and_validates_enums():
    payload = {
        "station": {"station_id": "X", "name": "N", "lat": 1.0, "lon": 2.0},
        "availability": {"start_year": 1900, "end_year": 2000},
        "request": {"station_id": "X", "start_year": 2000, "end_year": 2001},
        "year": {
            "element": "BOTH",
            "data": [{"year": 2000, "tmin_mean_c": 1.0, "tmax_mean_c": 2.0}],
        },
        "seasons": {
            "WINTER": {
                "element": "TMIN",
                "data": [{"year": 2000, "season": "WINTER", "tmin_mean_c": 0.0}],
            }
        },
    }

    model = StationDataResponse(**payload)

    assert model.year.element == ElementSelection.BOTH
    assert list(model.seasons.keys())[0] == SeasonKey.WINTER
    assert model.seasons[SeasonKey.WINTER].element == ElementSelection.TMIN


def test_station_data_response_rejects_invalid_season_key():
    payload = {
        "station": {"station_id": "X"},
        "availability": {"start_year": 1900, "end_year": 2000},
        "request": {"station_id": "X", "start_year": 2000, "end_year": 2001},
        "year": {"element": "BOTH", "data": []},
        "seasons": {
            "NOT_A_SEASON": {
                "element": "BOTH",
                "data": [],
            }
        },
    }

    with pytest.raises(ValidationError):
        StationDataResponse(**payload)


def test_station_data_response_requires_availability():
    payload = {
        "station": {"station_id": "X"},
        # availability missing
        "request": {"station_id": "X", "start_year": 2000, "end_year": 2001},
        "year": {"element": "BOTH", "data": []},
        "seasons": {},
    }

    with pytest.raises(ValidationError):
        StationDataResponse(**payload)