from fastapi import APIRouter, HTTPException
from psycopg import Error as PsycopgError

from app.api.schemas.station_search import (
    StationSearchRequest,
    StationSearchResponse,
    StationSearchResult,
)
from app.infrastructure.db.connection import connect_to_db
from app.application.station_search_service import find_nearby_stations

router = APIRouter(prefix="/stations", tags=["stations"])


@router.post("/search", response_model=StationSearchResponse)
def search_stations(body: StationSearchRequest):
    try:
        conn = connect_to_db()
        try:
            rows = find_nearby_stations(
                conn=conn,
                lat=float(body.lat),
                lon=float(body.lon),
                radius_km=float(body.radius_km),
                limit=int(body.limit),
            )
        finally:
            conn.close()

        # Service liefert list[dict] wie in deinem Beispiel
        stations = [StationSearchResult(**r) for r in rows]

        return StationSearchResponse(
            request=body,
            count=len(stations),
            stations=stations,
        )

    except PsycopgError:
        raise HTTPException(status_code=500, detail="Database error")
