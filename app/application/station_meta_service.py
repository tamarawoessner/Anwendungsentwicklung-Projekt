from app.infrastructure.db.station_repository import (
    read_location_for_station,
    read_years_for_station,
)


def get_station_meta(conn, station_id: str):
    if station_id is None or str(station_id).strip() == "":
        raise ValueError("station_id is required")

    station_id = str(station_id).strip()

    station = read_location_for_station(conn, station_id)
    availability = read_years_for_station(conn, station_id)

    return {
        "station": station,
        "availability": availability,
    }
