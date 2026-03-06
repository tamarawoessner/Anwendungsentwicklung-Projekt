import runpy
import sys
from unittest.mock import patch


def test_station_data_module_main_executes_without_db():
    # ensure fresh execution as __main__
    sys.modules.pop("app.application.station_data_service", None)

    class FakeConn:
        def close(self):
            pass

    with patch("app.infrastructure.db.connection.connect_to_db", return_value=FakeConn()), \
         patch("app.infrastructure.db.station_repository.read_location_for_station",
               return_value={"station_id": "ZI000067983", "name": "N", "lat": 1.0, "lon": 2.0}), \
         patch("app.infrastructure.db.station_repository.read_years_for_station", return_value=None), \
         patch("app.infrastructure.db.aggregation_repository.read_station_data_year", return_value=[]), \
         patch("app.infrastructure.db.aggregation_repository.read_station_data_seasons", return_value=[]):

        runpy.run_module("app.application.station_data_service", run_name="__main__")