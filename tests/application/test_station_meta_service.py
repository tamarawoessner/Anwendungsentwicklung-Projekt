import pytest
from unittest.mock import patch

from app.application.station_meta_service import get_station_meta


@patch("app.application.station_meta_service.read_years_for_station")
@patch("app.application.station_meta_service.read_location_for_station")
def test_get_station_meta_happy_path(mock_read_loc, mock_read_years):
    mock_read_loc.return_value = {"station_id": "X", "lat": 1.0, "lon": 2.0}
    mock_read_years.return_value = {"start_year": 1950, "end_year": 2000}

    res = get_station_meta(conn=None, station_id="X")

    assert res["station"] == {"station_id": "X", "lat": 1.0, "lon": 2.0}
    assert res["availability"] == {"start_year": 1950, "end_year": 2000}

    mock_read_loc.assert_called_once_with(None, "X")
    mock_read_years.assert_called_once_with(None, "X")


@patch("app.application.station_meta_service.read_years_for_station")
@patch("app.application.station_meta_service.read_location_for_station")
def test_get_station_meta_availability_none(mock_read_loc, mock_read_years):
    mock_read_loc.return_value = {"station_id": "X"}
    mock_read_years.return_value = None

    res = get_station_meta(conn=None, station_id="X")

    assert res["station"] == {"station_id": "X"}
    assert res["availability"] is None


@pytest.mark.parametrize("bad_station_id", [None, "", "   "])
def test_get_station_meta_rejects_missing_station_id(bad_station_id):
    with pytest.raises(ValueError, match="station_id is required"):
        get_station_meta(conn=None, station_id=bad_station_id)


@patch("app.application.station_meta_service.read_years_for_station")
@patch("app.application.station_meta_service.read_location_for_station")
def test_get_station_meta_strips_station_id(mock_read_loc, mock_read_years):
    mock_read_loc.return_value = {"station_id": "X"}
    mock_read_years.return_value = {"start_year": 1900, "end_year": 1901}

    res = get_station_meta(conn=None, station_id="  X  ")

    assert res["station"] == {"station_id": "X"}
    assert res["availability"]["start_year"] == 1900

    mock_read_loc.assert_called_once_with(None, "X")
    mock_read_years.assert_called_once_with(None, "X")