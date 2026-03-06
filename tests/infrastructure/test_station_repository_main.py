import runpy
import sys
from unittest.mock import patch

def test_station_repository_main_executes_without_db():
    sys.modules.pop("app.infrastructure.db.station_repository", None)
    with patch("app.infrastructure.db.connection.connect_to_db") as m_conn, \
         patch("app.infrastructure.db.station_repository.read_years_for_all_stations", return_value=[]):
        m_conn.return_value = object()
        runpy.run_module("app.infrastructure.db.station_repository", run_name="__main__")