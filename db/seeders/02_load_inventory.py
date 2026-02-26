#!/usr/bin/env python3
import os
import psycopg
from psycopg.rows import tuple_row
from dotenv import load_dotenv

load_dotenv()

# Inventory format: ID 1-11, LAT 13-20, LON 22-30, ELEMENT 32-35, FIRSTYEAR 37-40, LASTYEAR 42-45 :contentReference[oaicite:6]{index=6}


def parse_inventory_line(line: str):
    station_id = line[0:11].strip()
    element = line[31:35].strip()
    first_year = int(line[36:40].strip())
    last_year = int(line[41:45].strip())
    return (station_id, element, first_year, last_year)


def main():
    inv_file = os.environ.get("INVENTORY_FILE", "ghcnd-inventory.txt")
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit(
            "Set DATABASE_URL, e.g. postgresql://app:pass@localhost:5432/app"
        )

    batch = []
    batch_size = 20000

    with psycopg.connect(db_url, row_factory=tuple_row) as conn:
        conn.execute("SET search_path TO ghcn, public;")
        with conn.cursor() as cur:
            with open(inv_file, "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    if not line.strip():
                        continue
                    batch.append(parse_inventory_line(line))
                    if len(batch) >= batch_size:
                        cur.executemany(
                            """
                            INSERT INTO inventory (station_id, element, first_year, last_year)
                            VALUES (%s,%s,%s,%s)
                            ON CONFLICT (station_id, element) DO UPDATE SET
                              first_year = LEAST(inventory.first_year, EXCLUDED.first_year),
                              last_year  = GREATEST(inventory.last_year,  EXCLUDED.last_year);
                            """,
                            batch,
                        )
                        conn.commit()
                        batch.clear()

            if batch:
                cur.executemany(
                    """
                    INSERT INTO inventory (station_id, element, first_year, last_year)
                    VALUES (%s,%s,%s,%s)
                    ON CONFLICT (station_id, element) DO UPDATE SET
                      first_year = LEAST(inventory.first_year, EXCLUDED.first_year),
                      last_year  = GREATEST(inventory.last_year,  EXCLUDED.last_year);
                    """,
                    batch,
                )
                conn.commit()

    print("inventory import done.")


if __name__ == "__main__":
    main()
