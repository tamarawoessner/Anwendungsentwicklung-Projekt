from typing import Annotated
from pydantic import BaseModel, Field


class StationSearchRequest(BaseModel):
    lat: Annotated[float, Field(..., description="Latitude in degrees", ge=-90, le=90)]
    lon: Annotated[float, Field(..., description="Longitude in degrees", ge=-180, le=180)]
    radius_km: Annotated[float, Field(50, description="Search radius in kilometers", gt=0, le=2000)]
    limit: Annotated[int, Field(50, description="Max stations returned", ge=1, le=500)]


class StationSearchResult(BaseModel):
    station_id: str
    lat: float
    lon: float
    distance_km: float
    start_year: int
    end_year: int


class StationSearchResponse(BaseModel):
    request: StationSearchRequest
    count: int
    stations: list[StationSearchResult]
