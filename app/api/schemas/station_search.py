from typing import Annotated
from pydantic import BaseModel, Field, model_validator


class StationSearchRequest(BaseModel):
    lat: Annotated[float, Field(..., description="Latitude in degrees", ge=-90, le=90)]
    lon: Annotated[
        float, Field(..., description="Longitude in degrees", ge=-180, le=180)
    ]
    radius_km: Annotated[
        float, Field(50, description="Search radius in kilometers", gt=0, le=2000)
    ]
    limit: Annotated[int, Field(50, description="Max stations returned", ge=1, le=500)]
    start_year: Annotated[
        int | None,
        Field(None, description="Earliest requested year", ge=1700, le=2200),
    ]
    end_year: Annotated[
        int | None,
        Field(None, description="Latest requested year", ge=1700, le=2200),
    ]

    @model_validator(mode="after")
    def validate_year_range(self):
        if (
            self.start_year is not None
            and self.end_year is not None
            and self.start_year > self.end_year
        ):
            raise ValueError("start_year must be less than or equal to end_year")
        return self


class StationSearchResult(BaseModel):
    station_id: str
    name: str
    lat: float
    lon: float
    distance_km: float
    start_year: int
    end_year: int


class StationSearchResponse(BaseModel):
    request: StationSearchRequest
    count: int
    stations: list[StationSearchResult]
