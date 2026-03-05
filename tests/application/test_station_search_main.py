import runpy
import sys
from unittest.mock import patch

def test_station_search_module_main_executes_without_db():
    sys.modules.pop("app.application.station_search_service", None)

    class FakeConn: pass

    with patch("app.infrastructure.db.connection.connect_to_db", return_value=FakeConn()), \
         patch("app.infrastructure.db.station_repository.read_location_for_all_stations",
               return_value=[{"station_id": "A", "lat": 0.0, "lon": 0.0}]), \
         patch("app.infrastructure.db.station_repository.read_years_for_all_stations",
               return_value=[{"station_id": "A", "start_year": 1900, "end_year": 2000}]):
        runpy.run_module("app.application.station_search_service", run_name="__main__")