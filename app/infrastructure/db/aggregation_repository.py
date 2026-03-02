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
