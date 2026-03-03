from typing import Optional
from pydantic import BaseModel


class StationMetaInfo(BaseModel):
    station_id: str
    name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class StationAvailability(BaseModel):
    start_year: int
    end_year: int


class StationMetaResponse(BaseModel):
    station: Optional[StationMetaInfo] = None
    availability: Optional[StationAvailability] = None
