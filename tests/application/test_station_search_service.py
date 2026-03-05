from unittest.mock import patch

from app.application.station_search_service import find_nearby_stations


@patch("app.application.station_search_service.read_years_for_all_stations")
@patch("app.application.station_search_service.read_location_for_all_stations")
def test_returns_empty_when_no_stations(mock_read_locations, mock_read_years):
    mock_read_locations.return_value = []
    res = find_nearby_stations(conn=None, lat=0.0, lon=0.0)
    assert res == []
    mock_read_years.assert_not_called()


@patch("app.application.station_search_service.read_years_for_all_stations")
@patch("app.application.station_search_service.read_location_for_all_stations")
def test_sorts_by_distance_and_applies_limit(mock_read_locations, mock_read_years):
    # Two stations at different longitudes -> different distances
    mock_read_locations.return_value = [
        {"station_id": "A", "lat": 0.0, "lon": 0.0},
        {"station_id": "B", "lat": 0.0, "lon": 1.0},
    ]
    mock_read_years.return_value = [
        {"station_id": "A", "start_year": 1900, "end_year": 2000},
        {"station_id": "B", "start_year": 1900, "end_year": 2000},
    ]

    res = find_nearby_stations(
        conn=None, lat=0.0, lon=0.0, radius_km=10000, limit=1
    )

    assert len(res) == 1
    assert res[0]["station_id"] == "A"
    assert res[0]["distance_km"] == 0.0


@patch("app.application.station_search_service.read_years_for_all_stations")
@patch("app.application.station_search_service.read_location_for_all_stations")
def test_filters_by_radius(mock_read_locations, mock_read_years):
    mock_read_locations.return_value = [
        {"station_id": "A", "lat": 0.0, "lon": 0.0},
        {"station_id": "B", "lat": 0.0, "lon": 2.0},
    ]
    mock_read_years.return_value = [
        {"station_id": "A", "start_year": 1900, "end_year": 2000},
        {"station_id": "B", "start_year": 1900, "end_year": 2000},
    ]

    # ~111 km per degree longitude at equator -> 2 degrees ~222 km
    res = find_nearby_stations(
        conn=None, lat=0.0, lon=0.0, radius_km=150, limit=50
    )

    assert [r["station_id"] for r in res] == ["A"]


@patch("app.application.station_search_service.read_years_for_all_stations")
@patch("app.application.station_search_service.read_location_for_all_stations")
def test_filters_by_year_range_both_bounds(mock_read_locations, mock_read_years):
    mock_read_locations.return_value = [
        {"station_id": "A", "lat": 0.0, "lon": 0.0},
        {"station_id": "B", "lat": 0.0, "lon": 0.1},
    ]
    mock_read_years.return_value = [
        {"station_id": "A", "start_year": 1950, "end_year": 2010},
        {"station_id": "B", "start_year": 1980, "end_year": 1990},
    ]

    # Requires: start_year <= 1960 AND end_year >= 2000
    res = find_nearby_stations(
        conn=None,
        lat=0.0,
        lon=0.0,
        radius_km=10000,
        limit=50,
        start_year=1960,
        end_year=2000,
    )

    assert [r["station_id"] for r in res] == ["A"]


@patch("app.application.station_search_service.read_years_for_all_stations")
@patch("app.application.station_search_service.read_location_for_all_stations")
def test_skips_station_when_years_missing_for_required_range(mock_read_locations, mock_read_years):
    mock_read_locations.return_value = [
        {"station_id": "A", "lat": 0.0, "lon": 0.0},
    ]
    # No years row for A -> defaults to None/None
    mock_read_years.return_value = []

    res = find_nearby_stations(
        conn=None,
        lat=0.0,
        lon=0.0,
        radius_km=10000,
        limit=50,
        start_year=1960,
        end_year=2000,
    )

    assert res == []


@patch("app.application.station_search_service.read_years_for_all_stations")
@patch("app.application.station_search_service.read_location_for_all_stations")
def test_ignores_invalid_station_rows(mock_read_locations, mock_read_years):
    mock_read_locations.return_value = [
        {"station_id": None, "lat": 0.0, "lon": 0.0},   # invalid
        {"station_id": "A", "lat": None, "lon": 0.0},   # invalid
        {"station_id": "B", "lat": 0.0, "lon": 0.0},    # valid
    ]
    mock_read_years.return_value = [
        {"station_id": "B", "start_year": 1900, "end_year": 2000},
    ]

    res = find_nearby_stations(conn=None, lat=0.0, lon=0.0, radius_km=10000, limit=50)
    assert len(res) == 1
    assert res[0]["station_id"] == "B"


@patch("app.application.station_search_service.read_years_for_all_stations")
@patch("app.application.station_search_service.read_location_for_all_stations")
def test_limit_is_never_negative(mock_read_locations, mock_read_years):
    mock_read_locations.return_value = [
        {"station_id": "A", "lat": 0.0, "lon": 0.0},
    ]
    mock_read_years.return_value = [
        {"station_id": "A", "start_year": 1900, "end_year": 2000},
    ]

    res = find_nearby_stations(conn=None, lat=0.0, lon=0.0, radius_km=10000, limit=-5)
    assert res == []