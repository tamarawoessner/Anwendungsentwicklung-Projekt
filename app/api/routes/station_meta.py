from fastapi import APIRouter, HTTPException
from psycopg import Error as PsycopgError

from api.schemas.station_meta import StationMetaResponse
from infrastructure.db.connection import connect_to_db
from application.station_meta_service import get_station_meta

router = APIRouter(prefix="/stations", tags=["station-meta"])


@router.get(
    "/{station_id}/meta",
    response_model=StationMetaResponse,
)
def station_meta(station_id: str):
    try:
        conn = connect_to_db()
        try:
            result = get_station_meta(conn=conn, station_id=station_id)
        finally:
            conn.close()

        if result["station"] is None and result["availability"] is None:
            raise HTTPException(status_code=404, detail="Station not found")

        return StationMetaResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PsycopgError:
        raise HTTPException(status_code=500, detail="Database error")
