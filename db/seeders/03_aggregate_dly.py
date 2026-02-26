#!/usr/bin/env python3
import os
import glob
import calendar
from datetime import date

import psycopg
from psycopg.rows import tuple_row
from dotenv import load_dotenv

load_dotenv()


ELEMENTS = {"TMIN", "TMAX"}

# Expected fixed width: header (21) + 31 * (VALUE(5)+MFLAG(1)+QFLAG(1)+SFLAG(1)=8) = 269
MIN_DLY_LINE_LEN = 21 + 31 * 8  # 269


def safe_int(s: str):
    s = s.strip()
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return None


def parse_dly_line(line: str):
    # pad short/defective lines to avoid slicing -> '' -> int('') errors
    if len(line) < MIN_DLY_LINE_LEN:
        line = line.rstrip("\n").ljust(MIN_DLY_LINE_LEN)

    sid = line[0:11].strip()
    year = safe_int(line[11:15])
    month = safe_int(line[15:17])
    element = line[17:21].strip()

    if not sid or year is None or month is None:
        return None

    days = []
    base0 = 21
    for i in range(31):
        off = base0 + i * 8
        v = safe_int(line[off : off + 5])
        mflag = line[off + 5 : off + 6]
        qflag = line[off + 6 : off + 7]
        sflag = line[off + 7 : off + 8]
        days.append((v, mflag, qflag, sflag))

    return sid, year, month, element, days


def expected_days_year(year: int) -> int:
    return 366 if calendar.isleap(year) else 365


def meteorological_season_and_year(
    dt: date, southern_hemisphere: bool = False
) -> tuple[str, int]:
    # Meteorological seasons by date boundaries.
    # For season-year buckets, Dec belongs to the next year's cross-year season
    # (WINTER on north, SUMMER on south).
    m = dt.month

    if southern_hemisphere:
        if m in (12, 1, 2):
            return "SUMMER", (dt.year + 1 if m == 12 else dt.year)
        if m in (3, 4, 5):
            return "AUTUMN", dt.year
        if m in (6, 7, 8):
            return "WINTER", dt.year
        return "SPRING", dt.year  # 9, 10, 11

    if m in (3, 4, 5):
        return "SPRING", dt.year
    if m in (6, 7, 8):
        return "SUMMER", dt.year
    if m in (9, 10, 11):
        return "AUTUMN", dt.year
    return "WINTER", (dt.year + 1 if m == 12 else dt.year)  # 12, 1, 2


def expected_days_season(
    season_year: int, season: str, southern_hemisphere: bool = False
) -> int:
    # meteorological seasons:
    # SPRING: Mar-May (season_year)
    # SUMMER: Jun-Aug (season_year)
    # AUTUMN: Sep-Nov (season_year)
    # WINTER: Dec(prev) + Jan-Feb(current) where current = season_year
    if southern_hemisphere:
        # meteorological seasons on the southern hemisphere:
        # SUMMER: Dec(prev)-Feb(current), AUTUMN: Mar-May,
        # WINTER: Jun-Aug, SPRING: Sep-Nov
        if season == "SUMMER":
            months = [(season_year - 1, 12), (season_year, 1), (season_year, 2)]
        elif season == "AUTUMN":
            months = [(season_year, 3), (season_year, 4), (season_year, 5)]
        elif season == "WINTER":
            months = [(season_year, 6), (season_year, 7), (season_year, 8)]
        else:  # SPRING
            months = [(season_year, 9), (season_year, 10), (season_year, 11)]
    else:
        if season == "SPRING":
            months = [(season_year, 3), (season_year, 4), (season_year, 5)]
        elif season == "SUMMER":
            months = [(season_year, 6), (season_year, 7), (season_year, 8)]
        elif season == "AUTUMN":
            months = [(season_year, 9), (season_year, 10), (season_year, 11)]
        else:  # WINTER
            months = [(season_year - 1, 12), (season_year, 1), (season_year, 2)]

    return sum(calendar.monthrange(y, m)[1] for y, m in months)


def _clean_env(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip().strip('"').strip("'")


def main():
    dly_dir = _clean_env(os.environ.get("DLY_DIR")) or "./all"
    db_url = _clean_env(os.environ.get("DATABASE_URL"))
    if not db_url:
        raise SystemExit(
            "Set DATABASE_URL, e.g. postgresql://app:pass@localhost:5432/app"
        )

    files = glob.glob(os.path.join(dly_dir, "*.dly"))
    if not files:
        raise SystemExit(f"No .dly files found in {dly_dir}")

    with psycopg.connect(db_url, row_factory=tuple_row) as conn:
        conn.execute("SET search_path TO ghcn, public;")
        with conn.cursor() as cur:
            cur.execute("SELECT station_id, lat FROM stations;")
            station_lat = dict(cur.fetchall())

            def upsert_year(rows, chunk=5000):
                sql = """
                INSERT INTO year_agg
                  (station_id, year,
                   tmin_mean_c, tmax_mean_c,
                   tmin_days_present, tmin_days_expected,
                   tmax_days_present, tmax_days_expected)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (station_id, year) DO UPDATE SET
                  tmin_mean_c = EXCLUDED.tmin_mean_c,
                  tmax_mean_c = EXCLUDED.tmax_mean_c,
                  tmin_days_present = EXCLUDED.tmin_days_present,
                  tmin_days_expected = EXCLUDED.tmin_days_expected,
                  tmax_days_present = EXCLUDED.tmax_days_present,
                  tmax_days_expected = EXCLUDED.tmax_days_expected;
                """
                for i in range(0, len(rows), chunk):
                    cur.executemany(sql, rows[i : i + chunk])
                    conn.commit()

            def upsert_season(rows, chunk=5000):
                sql = """
                INSERT INTO season_agg
                  (station_id, year, season,
                   tmin_mean_c, tmax_mean_c,
                   tmin_days_present, tmin_days_expected,
                   tmax_days_present, tmax_days_expected)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (station_id, year, season) DO UPDATE SET
                  tmin_mean_c = EXCLUDED.tmin_mean_c,
                  tmax_mean_c = EXCLUDED.tmax_mean_c,
                  tmin_days_present = EXCLUDED.tmin_days_present,
                  tmin_days_expected = EXCLUDED.tmin_days_expected,
                  tmax_days_present = EXCLUDED.tmax_days_present,
                  tmax_days_expected = EXCLUDED.tmax_days_expected;
                """
                for i in range(0, len(rows), chunk):
                    cur.executemany(sql, rows[i : i + chunk])
                    conn.commit()

            bad_lines = 0
            short_lines = 0
            processed_lines = 0

            for path in files:
                # per-file accumulators (bounded memory)
                year_acc = {}  # (sid, year) -> sums/cnts
                season_acc = {}  # (sid, season_year, season) -> sums/cnts

                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    for line in f:
                        if not line.strip():
                            continue

                        if len(line.rstrip("\n")) < MIN_DLY_LINE_LEN:
                            short_lines += 1

                        parsed = parse_dly_line(line)
                        if parsed is None:
                            bad_lines += 1
                            continue

                        sid, year, month, element, days = parsed
                        processed_lines += 1

                        if element not in ELEMENTS:
                            continue

                        is_southern = (station_lat.get(sid) or 0.0) < 0

                        dim = calendar.monthrange(year, month)[1]

                        # init buckets
                        ykey = (sid, year)
                        yb = year_acc.setdefault(
                            ykey,
                            {
                                "TMIN_sum": 0.0,
                                "TMIN_cnt": 0,
                                "TMAX_sum": 0.0,
                                "TMAX_cnt": 0,
                            },
                        )

                        for d in range(1, dim + 1):
                            value, _mflag, _qflag, _sflag = days[d - 1]

                            # missing or unparsable
                            if value is None or value == -9999:
                                continue

                            v_c = value / 10.0  # tenths of °C -> °C

                            # year aggregation (calendar year)
                            if element == "TMIN":
                                yb["TMIN_sum"] += v_c
                                yb["TMIN_cnt"] += 1
                            else:
                                yb["TMAX_sum"] += v_c
                                yb["TMAX_cnt"] += 1

                            # season aggregation (meteorological, by date)
                            dt = date(year, month, d)
                            season, sy = meteorological_season_and_year(
                                dt, southern_hemisphere=is_southern
                            )
                            skey = (sid, sy, season)
                            sb = season_acc.setdefault(
                                skey,
                                {
                                    "TMIN_sum": 0.0,
                                    "TMIN_cnt": 0,
                                    "TMAX_sum": 0.0,
                                    "TMAX_cnt": 0,
                                },
                            )

                            if element == "TMIN":
                                sb["TMIN_sum"] += v_c
                                sb["TMIN_cnt"] += 1
                            else:
                                sb["TMAX_sum"] += v_c
                                sb["TMAX_cnt"] += 1

                # write file results
                year_rows = []
                for (sid, yr), acc in year_acc.items():
                    exp = expected_days_year(yr)
                    tmin_mean = (
                        (acc["TMIN_sum"] / acc["TMIN_cnt"]) if acc["TMIN_cnt"] else None
                    )
                    tmax_mean = (
                        (acc["TMAX_sum"] / acc["TMAX_cnt"]) if acc["TMAX_cnt"] else None
                    )
                    year_rows.append(
                        (
                            sid,
                            yr,
                            tmin_mean,
                            tmax_mean,
                            acc["TMIN_cnt"],
                            exp,
                            acc["TMAX_cnt"],
                            exp,
                        )
                    )
                if year_rows:
                    upsert_year(year_rows)

                season_rows = []
                for (sid, sy, season), acc in season_acc.items():
                    is_southern = (station_lat.get(sid) or 0.0) < 0
                    exp = expected_days_season(
                        sy, season, southern_hemisphere=is_southern
                    )
                    tmin_mean = (
                        (acc["TMIN_sum"] / acc["TMIN_cnt"]) if acc["TMIN_cnt"] else None
                    )
                    tmax_mean = (
                        (acc["TMAX_sum"] / acc["TMAX_cnt"]) if acc["TMAX_cnt"] else None
                    )
                    season_rows.append(
                        (
                            sid,
                            sy,
                            season,
                            tmin_mean,
                            tmax_mean,
                            acc["TMIN_cnt"],
                            exp,
                            acc["TMAX_cnt"],
                            exp,
                        )
                    )
                if season_rows:
                    upsert_season(season_rows)

            print("aggregation done.")
            print(f"processed lines: {processed_lines}")
            print(f"bad lines skipped: {bad_lines}")
            print(f"short lines padded: {short_lines}")


if __name__ == "__main__":
    main()
