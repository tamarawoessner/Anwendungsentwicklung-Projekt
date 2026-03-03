from enum import Enum
from typing import Any, Dict, Optional, Union, Literal

from pydantic import BaseModel, Field


# --- Input (Selection) ---


class ElementSelection(str, Enum):
    TMIN = "TMIN"
    TMAX = "TMAX"
    BOTH = "BOTH"


class SeasonKey(str, Enum):
    WINTER = "WINTER"
    SPRING = "SPRING"
    SUMMER = "SUMMER"
    AUTUMN = "AUTUMN"


class BoolPair(BaseModel):
    tmin: bool = False
    tmax: bool = False


# selection supports:
# - {"tmin": True, "tmax": True}
# - None
# - "BOTH" / "TMIN" / "TMAX"
SelectionValue = Union[BoolPair, None, ElementSelection]


class StationDataSelection(BaseModel):
    year: SelectionValue = Field(default=None)
    winter: SelectionValue = Field(default=None)
    spring: SelectionValue = Field(default=None)
    summer: SelectionValue = Field(default=None)
    autumn: SelectionValue = Field(default=None)


class StationDataRequest(BaseModel):
    selection: Optional[StationDataSelection] = None


# --- Output ---


class StationInfo(BaseModel):
    station_id: str
    name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class Availability(BaseModel):
    station_id: str
    start_year: int
    end_year: int


class RequestInfo(BaseModel):
    station_id: str
    start_year: int
    end_year: int


class YearAggPoint(BaseModel):
    station_id: str
    year: int
    tmin_mean_c: Optional[float] = None
    tmax_mean_c: Optional[float] = None


class YearAggBlock(BaseModel):
    element: ElementSelection
    data: list[YearAggPoint]


class SeasonAggPoint(BaseModel):
    station_id: str
    year: int
    season: SeasonKey
    tmin_mean_c: Optional[float] = None
    tmax_mean_c: Optional[float] = None


class SeasonAggBlock(BaseModel):
    element: Optional[ElementSelection] = None
    data: list[SeasonAggPoint]


class StationDataResponse(BaseModel):
    station: StationInfo
    availability: Availability
    request: RequestInfo
    year: YearAggBlock
    seasons: Dict[SeasonKey, SeasonAggBlock]
