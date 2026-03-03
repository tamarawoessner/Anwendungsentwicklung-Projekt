from domain.geo import haversine_km
from infrastructure.db.station_repository import (
    read_location_for_all_stations,
    read_years_for_all_stations,
)


def find_nearby_stations(
    conn,
    lat,
    lon,
    radius_km=50,
    limit=50,
    start_year=None,
    end_year=None,
):
    # 1) Basisdaten (id, lat, lon)
    stations = read_location_for_all_stations(conn)
    if not stations:
        return []

    # 2) Year-Ranges (id -> {start_year, end_year})
    years_rows = (
        read_years_for_all_stations(
            conn,
            required_start_year=start_year,
            required_end_year=end_year,
        )
        or []
    )
    years_by_station = {
        row["station_id"]: {
            "start_year": row["start_year"],
            "end_year": row["end_year"],
        }
        for row in years_rows
        if row and row.get("station_id")
    }

    enriched = []

    for s in stations:
        sid = s.get("station_id")
        s_lat = s.get("lat")
        s_lon = s.get("lon")
        if sid is None or s_lat is None or s_lon is None:
            continue

        d_km = haversine_km(lat, lon, s_lat, s_lon)

        if radius_km is not None and d_km > radius_km:
            continue

        years = years_by_station.get(sid, {"start_year": None, "end_year": None})

        if start_year is not None and end_year is not None:
            if years["start_year"] is None or years["end_year"] is None:
                continue
            if years["start_year"] > start_year or years["end_year"] < end_year:
                continue
        elif start_year is not None:
            if years["end_year"] is None or years["end_year"] < start_year:
                continue
        elif end_year is not None:
            if years["start_year"] is None or years["start_year"] > end_year:
                continue

        enriched.append(
            {
                "station_id": sid,
                "lat": s_lat,
                "lon": s_lon,
                "distance_km": round(d_km, 3),
                "start_year": years["start_year"],
                "end_year": years["end_year"],
            }
        )

    enriched.sort(key=lambda x: x["distance_km"])
    return enriched[: max(0, int(limit))]


if __name__ == "__main__":
    import json
    from infrastructure.db.connection import connect_to_db

    conn = connect_to_db()
    result = find_nearby_stations(
        conn=conn,
        lat=47.997,
        lon=7.842,
        radius_km=100,
        limit=5,
    )
    print(json.dumps(result, indent=2))
