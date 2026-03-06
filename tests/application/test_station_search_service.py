import importlib
from unittest.mock import patch

import app.application.station_search_service as svc
importlib.reload(svc)


def test_no_stations_returned_when_repo_none():
    with patch.object(svc, "read_location_for_all_stations", return_value=None):
        assert svc.find_nearby_stations(None, 0.0, 0.0) == []


def test_skips_invalid_station_rows_and_radius_continue():
    with patch.object(
        svc,
        "read_location_for_all_stations",
        return_value=[
            {"station_id": None, "lat": 0.0, "lon": 0.0},  # invalid sid -> continue
            {"station_id": "A", "lat": None, "lon": 0.0},  # invalid lat -> continue
            {"station_id": "B", "lat": 0.0, "lon": 2.0},   # far -> radius continue
            {"station_id": "C", "lat": 0.0, "lon": 0.0},   # keep
        ],
    ), patch.object(
        svc,
        "read_years_for_all_stations",
        return_value=[{"station_id": "C", "start_year": 1900, "end_year": 2000}],
    ):
        res = svc.find_nearby_stations(None, 0.0, 0.0, radius_km=50, limit=10)

    assert [r["station_id"] for r in res] == ["C"]


def test_year_filters_all_three_branches_skip():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]

    # only start_year: skip when end_year < start_year
    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations",
                      return_value=[{"station_id": "A", "start_year": 1900, "end_year": 1930}]):
        assert svc.find_nearby_stations(None, 0.0, 0.0, radius_km=1e9, limit=10, start_year=1940) == []

    # only end_year: skip when start_year > end_year
    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations",
                      return_value=[{"station_id": "A", "start_year": 2000, "end_year": 2010}]):
        assert svc.find_nearby_stations(None, 0.0, 0.0, radius_km=1e9, limit=10, end_year=1990) == []

    # both bounds: skip when range not fully covered
    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations",
                      return_value=[{"station_id": "A", "start_year": 1970, "end_year": 1990}]):
        assert svc.find_nearby_stations(None, 0.0, 0.0, radius_km=1e9, limit=10, start_year=1960, end_year=2000) == []


def test_both_bounds_skips_when_years_incomplete_none_values():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": None, "end_year": 2000}]
    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(None, 0.0, 0.0, radius_km=1e9, limit=10, start_year=1950, end_year=1990)
    assert res == []


def test_only_start_year_skips_when_end_year_is_none():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": 1900, "end_year": None}]
    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(None, 0.0, 0.0, radius_km=1e9, limit=10, start_year=1950)
    assert res == []


def test_only_end_year_skips_when_start_year_is_none():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": None, "end_year": 2000}]
    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(None, 0.0, 0.0, radius_km=1e9, limit=10, end_year=1990)
    assert res == []


def test_both_bounds_passes_to_append():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": 1900, "end_year": 2000}]

    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(
            conn=None,
            lat=0.0,
            lon=0.0,
            radius_km=1e9,
            limit=10,
            start_year=1950,
            end_year=1990,
        )

    assert len(res) == 1
    assert res[0]["station_id"] == "A"


def test_only_start_year_passes_to_append():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": 1900, "end_year": 2000}]

    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(
            conn=None,
            lat=0.0,
            lon=0.0,
            radius_km=1e9,
            limit=10,
            start_year=1950,
        )

    assert len(res) == 1
    assert res[0]["station_id"] == "A"


def test_only_end_year_passes_to_append():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": 1900, "end_year": 2000}]

    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(
            conn=None,
            lat=0.0,
            lon=0.0,
            radius_km=1e9,
            limit=10,
            end_year=1990,
        )

    assert len(res) == 1
    assert res[0]["station_id"] == "A"


def test_both_bounds_condition_false_appends():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": 1900, "end_year": 2000}]  # covers 1950..1990

    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(None, 0.0, 0.0, radius_km=None, limit=10, start_year=1950, end_year=1990)

    assert len(res) == 1
    assert res[0]["station_id"] == "A"


def test_only_start_year_end_year_less_than_start_year_condition_false_appends():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": 1900, "end_year": 2000}]  # end_year >= 1950

    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(None, 0.0, 0.0, radius_km=None, limit=10, start_year=1950)

    assert len(res) == 1
    assert res[0]["station_id"] == "A"


def test_only_end_year_start_year_greater_than_end_year_condition_false_appends():
    stations = [{"station_id": "A", "lat": 0.0, "lon": 0.0}]
    years = [{"station_id": "A", "start_year": 1900, "end_year": 2000}]  # start_year <= 1990

    with patch.object(svc, "read_location_for_all_stations", return_value=stations), \
         patch.object(svc, "read_years_for_all_stations", return_value=years):
        res = svc.find_nearby_stations(None, 0.0, 0.0, radius_km=None, limit=10, end_year=1990)

    assert len(res) == 1
    assert res[0]["station_id"] == "A"