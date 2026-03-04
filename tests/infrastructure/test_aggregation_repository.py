import pytest

from app.infrastructure.db.aggregation_repository import (
    read_station_data_year,
    read_station_data_seasons,
)


class _CursorCtx:
    """Hilfs-Cursor, der als context manager funktioniert."""
    def __init__(self, rows):
        self._rows = rows
        self.executed = []

    def execute(self, query, params):
        self.executed.append((query, params))

    def fetchall(self):
        return self._rows

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class _Conn:
    def __init__(self, rows):
        self._cursor = _CursorCtx(rows)

    def cursor(self):
        return self._cursor


def test_read_station_data_year_invalid_element_returns_none():
    conn = _Conn(rows=[])
    res = read_station_data_year(conn, "X", 2000, 2001, element="INVALID")
    assert res is None


def test_read_station_data_year_invalid_element_returns_none():
    conn = _Conn(rows=[])
    res = read_station_data_year(conn, "X", 2000, 2001, element="INVALID")
    assert res is None


def test_read_station_data_year_tmin_maps_rows_and_calls_sql():
    conn = _Conn(rows=[(2000, 1.2), (2001, None)])
    res = read_station_data_year(conn, "X", 2000, 2001, element="TMIN")

    assert res == [
        {"year": 2000, "tmin_mean_c": 1.2},
        {"year": 2001, "tmin_mean_c": None},
    ]

    assert len(conn._cursor.executed) == 1
    query, params = conn._cursor.executed[0]
    assert "FROM ghcn.year_agg" in query
    assert params == ("X", 2000, 2001)


def test_read_station_data_year_tmax_maps_rows():
    conn = _Conn(rows=[(1999, 10.0)])
    res = read_station_data_year(conn, "X", 1999, 1999, element="tmax")  # case-insensitive
    assert res == [{"year": 1999, "tmax_mean_c": 10.0}]


def test_read_station_data_year_both_maps_rows():
    conn = _Conn(rows=[(2000, 1.0, 2.0), (2001, None, 3.0)])
    res = read_station_data_year(conn, "X", 2000, 2001, element="BOTH")
    assert res == [
        {"year": 2000, "tmin_mean_c": 1.0, "tmax_mean_c": 2.0},
        {"year": 2001, "tmin_mean_c": None, "tmax_mean_c": 3.0},
    ]


def test_read_station_data_year_empty_rows_returns_empty_list():
    conn = _Conn(rows=[])
    res = read_station_data_year(conn, "X", 2000, 2001, element="BOTH")
    assert res == []


def test_read_station_data_seasons_invalid_element_returns_none():
    conn = _Conn(rows=[])
    res = read_station_data_seasons(conn, "X", 2000, 2001, season="WINTER", element="NOPE")
    assert res is None


def test_read_station_data_seasons_invalid_season_returns_none():
    conn = _Conn(rows=[])
    res = read_station_data_seasons(conn, "X", 2000, 2001, season="ALL", element="TMIN")
    assert res is None


def test_read_station_data_seasons_tmin_maps_rows_and_calls_sql():
    conn = _Conn(rows=[(2000, "WINTER", -1.0), (2001, "WINTER", None)])
    res = read_station_data_seasons(conn, "X", 2000, 2001, season="winter", element="TMIN")

    assert res == [
        {"year": 2000, "season": "WINTER", "tmin_mean_c": -1.0},
        {"year": 2001, "season": "WINTER", "tmin_mean_c": None},
    ]

    query, params = conn._cursor.executed[0]
    assert "FROM ghcn.season_agg" in query
    assert params == ("X", 2000, 2001, "WINTER")


def test_read_station_data_seasons_both_maps_rows():
    conn = _Conn(rows=[(2000, "SUMMER", 10.0, 20.0)])
    res = read_station_data_seasons(conn, "X", 2000, 2000, season="SUMMER", element="BOTH")
    assert res == [{"year": 2000, "season": "SUMMER", "tmin_mean_c": 10.0, "tmax_mean_c": 20.0}]


def test_read_station_data_seasons_empty_rows_returns_empty_list():
    conn = _Conn(rows=[])
    res = read_station_data_seasons(conn, "X", 2000, 2001, season="AUTUMN", element="TMAX")
    assert res == []