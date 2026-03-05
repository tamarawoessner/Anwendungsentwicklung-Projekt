import pytest
import importlib
from unittest.mock import patch

import app.application.station_data_service as ds
importlib.reload(ds)

_flags_to_element = ds._flags_to_element
_normalize_season_key = ds._normalize_season_key


def test_get_station_data_default_year_both():
    with patch.object(ds, "read_location_for_station", return_value={"station_id": "X"}), \
         patch.object(ds, "read_years_for_station", return_value=None), \
         patch.object(ds, "read_station_data_year", return_value=[]), \
         patch.object(ds, "read_station_data_seasons", return_value=[]):

        res = ds.get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={})

    assert res["year"]["element"] == "BOTH"
    assert res["year"]["data"] == []


def test_get_station_data_invalid_station_id():
    with pytest.raises(ValueError):
        ds.get_station_data(conn=None, station_id=" ", start_year=2000, end_year=2001)


def test_get_station_data_invalid_year_range():
    with pytest.raises(ValueError):
        ds.get_station_data(conn=None, station_id="X", start_year=2002, end_year=2001)


def test_get_station_data_invalid_year_selection_disables_year():
    with patch.object(ds, "read_location_for_station", return_value={"station_id": "X"}), \
         patch.object(ds, "read_years_for_station", return_value=None):
        res = ds.get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"year": "INVALID"})

    assert res["year"]["element"] is None
    assert res["year"]["data"] == []


def test_get_station_data_year_repo_none_becomes_empty_list():
    with patch.object(ds, "read_location_for_station", return_value={"station_id": "X"}), \
         patch.object(ds, "read_years_for_station", return_value=None), \
         patch.object(ds, "read_station_data_year", return_value=None):
        res = ds.get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"year": "BOTH"})

    assert res["year"]["data"] == []


def test_get_station_data_season_repo_none_becomes_empty_list():
    with patch.object(ds, "read_location_for_station", return_value={"station_id": "X"}), \
         patch.object(ds, "read_years_for_station", return_value=None), \
         patch.object(ds, "read_station_data_year", return_value=[]), \
         patch.object(ds, "read_station_data_seasons", return_value=None):

        res = ds.get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"winter": "TMIN"})

    assert res["seasons"]["WINTER"]["data"] == []


def test_get_station_data_skips_invalid_season_keys_and_elements():
    with patch.object(ds, "read_location_for_station", return_value={"station_id": "X"}), \
         patch.object(ds, "read_years_for_station", return_value=None), \
         patch.object(ds, "read_station_data_year", return_value=[]), \
         patch.object(ds, "read_station_data_seasons", return_value=[]):

        res = ds.get_station_data(
            conn=None,
            station_id="X",
            start_year=2000,
            end_year=2001,
            selection={
                "year": "BOTH",
                "unknown": "BOTH",
                "summer": None,
                "fall": "TMIN",
            },
        )

    assert "AUTUMN" in res["seasons"]
    assert "SUMMER" not in res["seasons"]


def test_get_station_data_year_key_present_but_none_disables_year():
    with patch.object(ds, "read_location_for_station", return_value={"station_id": "X"}), \
         patch.object(ds, "read_years_for_station", return_value=None):

        res = ds.get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"year": None})

    assert res["year"]["element"] is None
    assert res["year"]["data"] == []


def test_get_station_data_season_tmax_branch():
    with patch.object(ds, "read_location_for_station", return_value={"station_id": "X"}), \
         patch.object(ds, "read_years_for_station", return_value=None), \
         patch.object(ds, "read_station_data_year", return_value=[]), \
         patch.object(ds, "read_station_data_seasons", return_value=[]):

        res = ds.get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={"spring": "TMAX"})

    assert res["seasons"]["SPRING"]["element"] == "TMAX"


def test_get_station_data_sets_availability_out_when_available():
    with patch.object(ds, "read_location_for_station", return_value={"station_id": "X"}), \
         patch.object(ds, "read_years_for_station", return_value={"start_year": 1900, "end_year": 2000}), \
         patch.object(ds, "read_station_data_year", return_value=[]), \
         patch.object(ds, "read_station_data_seasons", return_value=[]):

        res = ds.get_station_data(conn=None, station_id="X", start_year=2000, end_year=2001, selection={})

    assert res["availability"] == {"start_year": 1900, "end_year": 2000}


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