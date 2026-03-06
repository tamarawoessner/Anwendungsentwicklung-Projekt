def read_years_for_station(conn, station_id):
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
            SELECT
                MIN(first_year) AS start_year,
                MAX(last_year)  AS end_year
            FROM ghcn.inventory
            WHERE station_id = %s
              AND element IN ('TMIN', 'TMAX');
            """,
                (station_id,),
            )
            result = cursor.fetchone()
            if result:
                start_year, end_year = result
                end_year = min(end_year, 2025)
                return {
                    "station_id": station_id,
                    "start_year": start_year,
                    "end_year": end_year,
                }
            else:
                return None
    except Exception as e:
        print(f"Error reading years for station {station_id}: {e}")
        return None


def read_years_for_all_stations(
    conn,
    required_start_year=None,
    required_end_year=None,
):
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT
                    station_id,
                    MIN(first_year) AS start_year,
                    MAX(last_year)  AS end_year
                FROM ghcn.inventory
                WHERE element IN ('TMIN', 'TMAX')
                GROUP BY station_id
            """

            params = []
            having_clauses = []

            if required_start_year is not None and required_end_year is not None:
                having_clauses.append("MIN(first_year) <= %s")
                having_clauses.append("MAX(last_year) >= %s")
                params.extend([required_start_year, required_end_year])
            elif required_start_year is not None:
                having_clauses.append("MAX(last_year) >= %s")
                params.append(required_start_year)
            elif required_end_year is not None:
                having_clauses.append("MIN(first_year) <= %s")
                params.append(required_end_year)

            if having_clauses:
                query += "\nHAVING " + " AND ".join(having_clauses)

            query += "\nORDER BY station_id;"

            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()

        if not rows:
            return []

        return [
            {
                "station_id": sid,
                "start_year": start_year,
                "end_year": min(end_year, 2025),
            }
            for (sid, start_year, end_year) in rows
        ]

    except Exception as e:
        print(f"Error reading years for all stations: {e}")
        return None


def read_location_for_station(conn, station_id: str):
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT station_id, name, lat, lon
                FROM ghcn.stations
                WHERE station_id = %s;
                """,
                (station_id,),
            )
            result = cursor.fetchone()

            if result:
                sid, name, lat, lon = result
                return {
                    "station_id": sid,
                    "name": (name or "").strip(),
                    "lat": float(lat) if lat is not None else None,
                    "lon": float(lon) if lon is not None else None,
                }
            else:
                return None

    except Exception as e:
        print(f"Error reading station basic data for station {station_id}: {e}")
        return None


def read_location_for_all_stations(conn):
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT DISTINCT s.station_id, s.name, s.lat, s.lon
                FROM ghcn.stations s
                JOIN ghcn.inventory i
                  ON i.station_id = s.station_id
                WHERE i.element IN ('TMIN', 'TMAX')
                ORDER BY s.station_id;
                """
            )
            rows = cursor.fetchall()

            if rows:
                return [
                    {
                        "station_id": sid,
                        "name": (name or "").strip(),
                        "lat": float(lat) if lat is not None else None,
                        "lon": float(lon) if lon is not None else None,
                    }
                    for (sid, name, lat, lon) in rows
                ]
            else:
                return []

    except Exception as e:
        print(f"Error reading station ids and locations with TMIN/TMAX: {e}")
        return None


if __name__ == "__main__":
    from app.infrastructure.db.connection import connect_to_db

    conn = connect_to_db()
    print(read_years_for_all_stations(conn))
