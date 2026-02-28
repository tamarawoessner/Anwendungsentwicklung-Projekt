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
