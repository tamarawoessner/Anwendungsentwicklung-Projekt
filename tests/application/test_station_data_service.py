import pytest
from unittest.mock import patch

from app.application.station_data_service import (
    get_station_data,
    _flags_to_element,
    _normalize_season_key,
)


@patch("app.application.station_data_service.read_location_for_station", return_value={"station_id": "X"})
@patch("app.application.station_data_service.read_years_for_station", return_value={"start_year": 1900, "end_year": 2000})
@patch("app.application.station_data_service.read_station_data_year", return_value=[])
@patch("app.application.station_data_service.read_station_data_seasons", return_value=[])
def test_get_station_data_default_year_both(*_):
    res = get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={})
    assert res["year"]["element"] == "BOTH"
    assert res["year"]["data"] == []


def test_get_station_data_invalid_station_id():
    with pytest.raises(ValueError):
        get_station_data(conn=None, station_id=" ", start_year=2000, end_year=2001)


def test_get_station_data_invalid_year_range():
    with pytest.raises(ValueError):
        get_station_data(conn=None, station_id="X", start_year=2002, end_year=2001)


@patch("app.application.station_data_service.read_location_for_station", return_value={"station_id": "X"})
@patch("app.application.station_data_service.read_years_for_station", return_value=None)
def test_get_station_data_invalid_year_selection_disables_year(*_):
    res = get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"year": "INVALID"})
    assert res["year"]["element"] is None
    assert res["year"]["data"] == []


@patch("app.application.station_data_service.read_location_for_station", return_value={"station_id": "X"})
@patch("app.application.station_data_service.read_years_for_station", return_value=None)
@patch("app.application.station_data_service.read_station_data_year", return_value=None)
def test_get_station_data_year_repo_none_becomes_empty_list(*_):
    res = get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"year": "BOTH"})
    assert res["year"]["data"] == []


@patch("app.application.station_data_service.read_location_for_station", return_value={"station_id": "X"})
@patch("app.application.station_data_service.read_years_for_station", return_value=None)
@patch("app.application.station_data_service.read_station_data_year", return_value=[])
@patch("app.application.station_data_service.read_station_data_seasons", return_value=None)
def test_get_station_data_season_repo_none_becomes_empty_list(*_):
    res = get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"winter": "TMIN"})
    assert res["seasons"]["WINTER"]["data"] == []


@patch("app.application.station_data_service.read_location_for_station", return_value={"station_id": "X"})
@patch("app.application.station_data_service.read_years_for_station", return_value=None)
@patch("app.application.station_data_service.read_station_data_year", return_value=[])
@patch("app.application.station_data_service.read_station_data_seasons", return_value=[])
def test_get_station_data_skips_invalid_season_keys_and_elements(*_):
    res = get_station_data(
        conn=None,
        station_id="X",
        start_year=2000,
        end_year=2001,
        selection={
            "year": "BOTH",
            "unknown": "BOTH",  # invalid season -> skip
            "summer": None,     # element None -> skip
            "fall": "TMIN",     # mapped to AUTUMN -> included
        },
    )
    assert "AUTUMN" in res["seasons"]
    assert "SUMMER" not in res["seasons"]


@patch("app.application.station_data_service.read_location_for_station", return_value={"station_id": "X"})
@patch("app.application.station_data_service.read_years_for_station", return_value=None)
def test_get_station_data_year_key_present_but_none_disables_year(*_):
    res = get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"year": None})
    assert res["year"]["element"] is None
    assert res["year"]["data"] == []


@patch("app.application.station_data_service.read_location_for_station", return_value={"station_id": "X"})
@patch("app.application.station_data_service.read_years_for_station", return_value=None)
@patch("app.application.station_data_service.read_station_data_year", return_value=[])
@patch("app.application.station_data_service.read_station_data_seasons", return_value=[])
def test_get_station_data_season_tmax_branch(*_):
    res = get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"spring": "TMAX"})
    assert res["seasons"]["SPRING"]["element"] == "TMAX"


def test_flags_to_element_all_variants():
    assert _flags_to_element(None) is None
    assert _flags_to_element("tmin") == "TMIN"
    assert _flags_to_element("TMAX") == "TMAX"
    assert _flags_to_element(" both ") == "BOTH"
    assert _flags_to_element("invalid") is None

    assert _flags_to_element({"tmin": True, "tmax": True}) == "BOTH"
    assert _flags_to_element({"tmin": True, "tmax": False}) == "TMIN"
    assert _flags_to_element({"tmin": False, "tmax": True}) == "TMAX"
    assert _flags_to_element({"tmin": False, "tmax": False}) is None
    assert _flags_to_element({}) is None


def test_normalize_season_key_variants():
    assert _normalize_season_key("winter") == "WINTER"
    assert _normalize_season_key("fall") == "AUTUMN"
    assert _normalize_season_key("unknown") is None


def test_flags_to_element_unknown_type_returns_none():
    assert _flags_to_element(123) is None


def test_normalize_season_key_empty_returns_none():
    assert _normalize_season_key("") is None
    assert _normalize_season_key(None) is None