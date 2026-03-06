from app.infrastructure.db.station_repository import (
    read_years_for_station,
    read_years_for_all_stations,
    read_location_for_station,
    read_location_for_all_stations,
)


class _Cursor:
    def __init__(self, fetchone=None, fetchall=None, raise_on_execute=False):
        self._fetchone = fetchone
        self._fetchall = fetchall
        self.raise_on_execute = raise_on_execute
        self.executed = []

    def execute(self, query, params=None):
        if self.raise_on_execute:
            raise Exception("boom")
        self.executed.append((query, params))

    def fetchone(self):
        return self._fetchone

    def fetchall(self):
        return self._fetchall

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class _Conn:
    def __init__(self, cursor):
        self._cursor = cursor

    def cursor(self):
        return self._cursor


def test_read_years_for_station_ok():
    conn = _Conn(_Cursor(fetchone=(1900, 2000)))
    res = read_years_for_station(conn, "X")
    assert res == {"station_id": "X", "start_year": 1900, "end_year": 2000}


def test_read_years_for_station_none():
    conn = _Conn(_Cursor(fetchone=None))
    assert read_years_for_station(conn, "X") is None


def test_read_years_for_station_exception_returns_none():
    conn = _Conn(_Cursor(raise_on_execute=True))
    assert read_years_for_station(conn, "X") is None


def test_read_years_for_all_stations_no_filters():
    conn = _Conn(_Cursor(fetchall=[("A", 1900, 2000)]))
    res = read_years_for_all_stations(conn)
    assert res == [{"station_id": "A", "start_year": 1900, "end_year": 2000}]
    q, params = conn._cursor.executed[0]
    assert "HAVING" not in q
    assert params == ()


def test_read_years_for_all_stations_both_bounds_adds_having():
    conn = _Conn(_Cursor(fetchall=[]))
    res = read_years_for_all_stations(conn, required_start_year=1950, required_end_year=1990)
    assert res == []
    q, params = conn._cursor.executed[0]
    assert "HAVING" in q
    assert params == (1950, 1990)


def test_read_years_for_all_stations_only_start_year_adds_having():
    conn = _Conn(_Cursor(fetchall=[]))
    res = read_years_for_all_stations(conn, required_start_year=1980)
    assert res == []
    q, params = conn._cursor.executed[0]
    assert "HAVING" in q
    assert params == (1980,)


def test_read_years_for_all_stations_only_end_year_adds_having():
    conn = _Conn(_Cursor(fetchall=[]))
    res = read_years_for_all_stations(conn, required_end_year=1980)
    assert res == []
    q, params = conn._cursor.executed[0]
    assert "HAVING" in q
    assert params == (1980,)


def test_read_years_for_all_stations_empty_rows_returns_empty_list():
    conn = _Conn(_Cursor(fetchall=[]))
    assert read_years_for_all_stations(conn) == []


def test_read_location_for_station_ok_and_strips_name():
    conn = _Conn(_Cursor(fetchone=("X", "  Name  ", 1.0, 2.0)))
    res = read_location_for_station(conn, "X")
    assert res["name"] == "Name"
    assert res["lat"] == 1.0
    assert res["lon"] == 2.0


def test_read_location_for_station_returns_none_when_no_row():
    conn = _Conn(_Cursor(fetchone=None))
    assert read_location_for_station(conn, "X") is None


def test_read_location_for_station_exception_returns_none():
    conn = _Conn(_Cursor(raise_on_execute=True))
    assert read_location_for_station(conn, "X") is None


def test_read_location_for_all_stations_ok():
    conn = _Conn(_Cursor(fetchall=[("A", "NameA", 1.0, 2.0), ("B", "NameB", None, 3.0)]))
    res = read_location_for_all_stations(conn)
    assert res == [
        {"station_id": "A", "name": "NameA", "lat": 1.0, "lon": 2.0},
        {"station_id": "B", "name": "NameB", "lat": None, "lon": 3.0},
    ]


def test_read_location_for_all_stations_rows_none_returns_empty_list():
    conn = _Conn(_Cursor(fetchall=None))
    assert read_location_for_all_stations(conn) == []


def test_read_location_for_all_stations_exception_returns_none():
    conn = _Conn(_Cursor(raise_on_execute=True))
    assert read_location_for_all_stations(conn) is None