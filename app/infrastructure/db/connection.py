import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection settings
DB_HOST = "db"
DB_PORT = 5432
DB_NAME = "app"
DB_USER = "app"
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")


# Connect to PostgreSQL
def connect_to_db():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
        )
        print("Connection successful")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


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


def read_station_location(conn, station_id: str):
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


def read_all_stations_location(conn):
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT DISTINCT s.station_id, s.lat, s.lon
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
                        "lat": float(lat) if lat is not None else None,
                        "lon": float(lon) if lon is not None else None,
                    }
                    for (sid, lat, lon) in rows
                ]
            else:
                return []

    except Exception as e:
        print(f"Error reading station ids and locations with TMIN/TMAX: {e}")
        return None


def read_station_data_year(
    conn, station_id: str, start_year: int, end_year: int, element: str
):
    """
    Read yearly aggregates for a station in a year range.
    element: "TMIN", "TMAX", or "BOTH" (case-insensitive).
    """
    try:
        element = (element or "").upper().strip()

        if element not in {"TMIN", "TMAX", "BOTH"}:
            raise ValueError("element must be one of: 'TMIN', 'TMAX', 'BOTH'")

        # Select only the columns we need depending on element
        if element == "TMIN":
            select_cols = """
                station_id, year,
                tmin_mean_c
            """
        elif element == "TMAX":
            select_cols = """
                station_id, year,
                tmax_mean_c
            """
        else:  # BOTH
            select_cols = """
                station_id, year,
                tmin_mean_c, tmax_mean_c
            """

        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {select_cols}
                FROM ghcn.year_agg
                WHERE station_id = %s
                  AND year BETWEEN %s AND %s
                ORDER BY year;
                """,
                (station_id, start_year, end_year),
            )
            rows = cursor.fetchall()

        if not rows:
            return []

        # Map rows to dicts (keep same "pattern": list of dicts)
        results = []
        for row in rows:
            if element == "TMIN":
                sid, year, tmin_mean_c = row
                results.append(
                    {
                        "station_id": sid,
                        "year": int(year),
                        "tmin_mean_c": (
                            float(tmin_mean_c) if tmin_mean_c is not None else None
                        ),
                    }
                )
            elif element == "TMAX":
                sid, year, tmax_mean_c = row
                results.append(
                    {
                        "station_id": sid,
                        "year": int(year),
                        "tmax_mean_c": (
                            float(tmax_mean_c) if tmax_mean_c is not None else None
                        ),
                    }
                )
            else:  # BOTH
                (
                    sid,
                    year,
                    tmin_mean_c,
                    tmax_mean_c,
                ) = row
                results.append(
                    {
                        "station_id": sid,
                        "year": int(year),
                        "tmin_mean_c": (
                            float(tmin_mean_c) if tmin_mean_c is not None else None
                        ),
                        "tmax_mean_c": (
                            float(tmax_mean_c) if tmax_mean_c is not None else None
                        ),
                    }
                )

        return results

    except Exception as e:
        print(
            f"Error reading yearly station data for station {station_id} "
            f"({start_year}-{end_year}, element={element}): {e}"
        )
        return None


def read_station_data_seasons(
    conn, station_id: str, start_year: int, end_year: int, season: str, element: str
):
    """
    Read seasonal aggregates for a station in a year range, optionally filtered by season.
    season: "WINTER", "SPRING", "SUMMER", "AUTUMN" (case-insensitive) or "ALL"/None for all seasons.
    element: "TMIN", "TMAX", or "BOTH" (case-insensitive).
    """
    try:
        element = (element or "").upper().strip()
        season = (season or "").upper().strip()

        allowed_elements = {"TMIN", "TMAX", "BOTH"}

        if element not in allowed_elements:
            raise ValueError("element must be one of: 'TMIN', 'TMAX', 'BOTH'")

        allowed_seasons = {"WINTER", "SPRING", "SUMMER", "AUTUMN"}

        if season not in allowed_seasons:
            raise ValueError(
                "season must be one of: 'WINTER','SPRING','SUMMER','AUTUMN'"
            )

        if element == "TMIN":
            select_cols = """
                station_id, year, season,
                tmin_mean_c
            """
        elif element == "TMAX":
            select_cols = """
                station_id, year, season,
                tmax_mean_c
            """
        else:  # BOTH
            select_cols = """
                station_id, year, season,
                tmin_mean_c, tmax_mean_c
            """

        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {select_cols}
                FROM ghcn.season_agg
                WHERE station_id = %s
                  AND year BETWEEN %s AND %s
                  AND season = %s
                ORDER BY year, season;
                """,
                (station_id, start_year, end_year, season),
            )
            rows = cursor.fetchall()

        if not rows:
            return []

        results = []
        for row in rows:
            if element == "TMIN":
                sid, year, season_val, tmin_mean_c = row
                results.append(
                    {
                        "station_id": sid,
                        "year": int(year),
                        "season": season_val,
                        "tmin_mean_c": (
                            float(tmin_mean_c) if tmin_mean_c is not None else None
                        ),
                    }
                )
            elif element == "TMAX":
                sid, year, season_val, tmax_mean_c = row
                results.append(
                    {
                        "station_id": sid,
                        "year": int(year),
                        "season": season_val,
                        "tmax_mean_c": (
                            float(tmax_mean_c) if tmax_mean_c is not None else None
                        ),
                    }
                )
            else:  # BOTH
                (
                    sid,
                    year,
                    season_val,
                    tmin_mean_c,
                    tmax_mean_c,
                ) = row
                results.append(
                    {
                        "station_id": sid,
                        "year": int(year),
                        "season": season_val,
                        "tmin_mean_c": (
                            float(tmin_mean_c) if tmin_mean_c is not None else None
                        ),
                        "tmax_mean_c": (
                            float(tmax_mean_c) if tmax_mean_c is not None else None
                        ),
                    }
                )

        return results

    except Exception as e:
        print(
            f"Error reading seasonal station data for station {station_id} "
            f"({start_year}-{end_year}, season={season}, element={element}): {e}"
        )
        return None


if __name__ == "__main__":
    conn = connect_to_db()
    if conn:
        print(read_years_for_station(conn, "ACW00011604"))
        print(read_years_for_station(conn, "ACW00011647"))
        print(read_years_for_station(conn, "AGE00135039"))
        print(read_station_location(conn, "ACW00011604"))
        print(read_station_location(conn, "ACW00011647"))
        print(read_station_location(conn, "AGE00135039"))
        # print(read_all_stations_location(conn))
        print(read_station_data_year(conn, "ACW00011647", 1961, 2025, "BOTH"))
        print(read_station_data_year(conn, "ACW00011647", 1961, 2025, "TMIN"))
        print(read_station_data_year(conn, "AGE00135039", 1882, 1966, "TMAX"))
        print(
            read_station_data_seasons(conn, "AGE00135039", 1882, 1966, "WINTER", "TMAX")
        )
