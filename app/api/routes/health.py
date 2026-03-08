import os

from fastapi import APIRouter, HTTPException
from psycopg import Error as PsycopgError

from app.application.station_meta_service import get_station_meta
from app.infrastructure.db.connection import connect_to_db

router = APIRouter(tags=["health"])
HEALTHCHECK_STATION_ID = "ACW00011604"


@router.get("/health")
def health():
    try:
        conn = connect_to_db()
        if conn is None:
            raise HTTPException(status_code=503, detail="Database not ready")

        try:
            result = get_station_meta(conn=conn, station_id=HEALTHCHECK_STATION_ID)
        finally:
            conn.close()

        if result.get("station") is None:
            raise HTTPException(
                status_code=503, detail="Readiness check station not found"
            )

        return {
            "status": "ok",
            "checked_station_id": HEALTHCHECK_STATION_ID,
        }

    except ValueError as e:
        raise HTTPException(status_code=503, detail=f"Readiness check invalid: {e}")
    except PsycopgError:
        raise HTTPException(status_code=503, detail="Database not ready")
