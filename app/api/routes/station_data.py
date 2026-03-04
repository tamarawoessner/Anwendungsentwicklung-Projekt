from fastapi import APIRouter, HTTPException, Query
from psycopg import Error as PsycopgError

from app.api.schemas.station_data import StationDataRequest, StationDataResponse
from app.infrastructure.db.connection import connect_to_db
from app.application.station_data_service import get_station_data

router = APIRouter(prefix="/stations", tags=["station-data"])


@router.post(
    "/{station_id}/data",
    response_model=StationDataResponse,
    response_model_exclude_none=True,
)
def station_data(
    station_id: str,
    body: StationDataRequest,
    start_year: int = Query(..., ge=1700, le=2025),
    end_year: int = Query(..., ge=1700, le=2025),
):
    try:
        selection = (
            body.selection.model_dump(exclude_unset=True) if body.selection else None
        )

        conn = connect_to_db()
        try:
            result = get_station_data(
                conn=conn,
                station_id=station_id,
                start_year=start_year,
                end_year=end_year,
                selection=selection,
            )
        finally:
            conn.close()

        return StationDataResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PsycopgError:
        raise HTTPException(status_code=500, detail="Database error")
