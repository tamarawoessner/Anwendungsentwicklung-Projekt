# app/application/station_data_service.py

from app.infrastructure.db.aggregation_repository import (
    read_station_data_year,
    read_station_data_seasons,
)
from app.infrastructure.db.station_repository import (
    read_location_for_station,
    read_years_for_station,
)


_ALLOWED_SEASONS = {"WINTER", "SPRING", "SUMMER", "AUTUMN"}


def _flags_to_element(selection):
    """
    selection kann sein:
      - None
      - "TMIN" / "TMAX" / "BOTH"
      - {"tmin": True/False, "tmax": True/False}
    Rückgabe: "TMIN" | "TMAX" | "BOTH" | None
    """
    if selection is None:
        return None

    if isinstance(selection, str):
        s = selection.strip().upper()
        if s in {"TMIN", "TMAX", "BOTH"}:
            return s
        return None

    if isinstance(selection, dict):
        tmin = bool(selection.get("tmin"))
        tmax = bool(selection.get("tmax"))

        if tmin and tmax:
            return "BOTH"
        if tmin:
            return "TMIN"
        if tmax:
            return "TMAX"
        return None

    return None


def _normalize_season_key(key):
    if not key:
        return None
    k = str(key).strip().upper()
    # erlaubte Varianten aus JSON:
    # "winter" / "WINTER" / "spring" / "fruehling" etc. -> hier nur engl. Kern
    mapping = {
        "WINTER": "WINTER",
        "SPRING": "SPRING",
        "SUMMER": "SUMMER",
        "AUTUMN": "AUTUMN",
        "FALL": "AUTUMN",
    }
    return mapping.get(k)


def get_station_data(conn, station_id, start_year, end_year, selection=None):
    if station_id is None or str(station_id).strip() == "":
        raise ValueError("station_id is required")

    start_year = int(start_year)
    end_year = int(end_year)
    if start_year > end_year:
        raise ValueError("start_year must be <= end_year")

    selection = selection or {}

    # --- Metadata / Context ---
    station_meta = read_location_for_station(conn, station_id)
    availability = read_years_for_station(conn, station_id)

    availability_out = None
    if availability is not None:
        availability_out = {
            "start_year": availability["start_year"],
            "end_year": availability["end_year"],
        }

    # --- Year block ---
    year_requested = "year" in selection
    year_element = _flags_to_element(selection.get("year"))

    if not year_requested:
        # Default gemäß UC3: Jahr + Tmin/Tmax
        year_element = "BOTH"

    if year_element is not None:
        year_data = read_station_data_year(
            conn=conn,
            station_id=station_id,
            start_year=start_year,
            end_year=end_year,
            element=year_element,
        )
        if year_data is None:
            year_data = []
    else:
        year_data = []

    # --- Seasons block(s) ---
    seasons_out = {}

    # wir lesen alle Keys außer "year" als Saison-Auswahl
    for key, value in selection.items():
        if str(key).strip().lower() == "year":
            continue

        season = _normalize_season_key(key)
        if season is None:
            continue

        element = _flags_to_element(value)
        if element is None:
            continue

        rows = read_station_data_seasons(
            conn=conn,
            station_id=station_id,
            start_year=start_year,
            end_year=end_year,
            season=season,
            element=element,
        )
        if rows is None:
            rows = []

        seasons_out[season] = {
            "element": element,
            "data": rows,
        }

    # --- Final Response ---
    return {
        "station": station_meta,  # {station_id, name, lat, lon} oder None
        "availability": availability_out,  # {start_year,end_year}
        "request": {
            "station_id": station_id,
            "start_year": start_year,
            "end_year": end_year,
        },
        "year": {
            "element": year_element,
            "data": year_data,
        },
        "seasons": seasons_out,  # dict WINTER/SPRING/SUMMER/AUTUMN
    }


if __name__ == "__main__":
    import json
    from app.infrastructure.db.connection import connect_to_db

    conn = connect_to_db()
    result = get_station_data(
        conn=conn,
        station_id="ZI000067983",
        start_year=1951,
        end_year=2025,
        selection={
            "year": {"tmin": True, "tmax": True},
            "winter": {"tmin": True},
            "spring": {"tmax": True},
            "summer": None,
            "autumn": "BOTH",
        },
    )
    print(json.dumps(result, indent=2))
