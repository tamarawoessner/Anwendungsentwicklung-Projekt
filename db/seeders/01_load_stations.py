#!/usr/bin/env python3
import os
import psycopg
from psycopg.rows import tuple_row
from dotenv import load_dotenv

load_dotenv()

# GHCN Readme: ghcnd-stations.txt columns: ID 1-11, LAT 13-20, LON 22-30, ELEV 32-37,
# STATE 39-40, NAME 42-71, GSN 73-75, HCN/CRN 77-79, WMO 81-85. :contentReference[oaicite:4]{index=4}


def parse_station_line(line: str):
    station_id = line[0:11].strip()
    lat = float(line[12:20].strip())
    lon = float(line[21:30].strip())
    elev_raw = line[31:37].strip()
    elevation = None if elev_raw == "" else float(elev_raw)
    state = line[38:40].strip() or None
    name = line[41:71].strip()
    gsn_flag = line[72:75].strip() or None
    hcn_crn_flag = line[76:79].strip() or None
    wmo_id = line[80:85].strip() or None
    return (
        station_id,
        lat,
        lon,
        elevation,
        state,
        name,
        gsn_flag,
        hcn_crn_flag,
        wmo_id,
    )


def main():
    stations_file = os.environ.get("STATIONS_FILE", "ghcnd-stations.txt")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit(
            "Set DATABASE_URL, e.g. postgresql://app:pass@localhost:5432/app"
        )

    batch = []
    batch_size = 5000

    with psycopg.connect(db_url, row_factory=tuple_row) as conn:
        conn.execute("SET search_path TO ghcn, public;")
        with conn.cursor() as cur:
            with open(stations_file, "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    if not line.strip():
                        continue
                    batch.append(parse_station_line(line))
                    if len(batch) >= batch_size:
                        cur.executemany(
                            """
                            INSERT INTO stations
                              (station_id, lat, lon, elevation_m, state, name, gsn_flag, hcn_crn_flag, wmo_id)
                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                            ON CONFLICT (station_id) DO UPDATE SET
                              lat = EXCLUDED.lat,
                              lon = EXCLUDED.lon,
                              elevation_m = EXCLUDED.elevation_m,
                              state = EXCLUDED.state,
                              name = EXCLUDED.name,
                              gsn_flag = EXCLUDED.gsn_flag,
                              hcn_crn_flag = EXCLUDED.hcn_crn_flag,
                              wmo_id = EXCLUDED.wmo_id;
                            """,
                            batch,
                        )
                        conn.commit()
                        batch.clear()

            if batch:
                cur.executemany(
                    """
                    INSERT INTO stations
                      (station_id, lat, lon, elevation_m, state, name, gsn_flag, hcn_crn_flag, wmo_id)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (station_id) DO UPDATE SET
                      lat = EXCLUDED.lat,
                      lon = EXCLUDED.lon,
                      elevation_m = EXCLUDED.elevation_m,
                      state = EXCLUDED.state,
                      name = EXCLUDED.name,
                      gsn_flag = EXCLUDED.gsn_flag,
                      hcn_crn_flag = EXCLUDED.hcn_crn_flag,
                      wmo_id = EXCLUDED.wmo_id;
                    """,
                    batch,
                )
                conn.commit()

    print("stations import done.")


if __name__ == "__main__":
    main()
