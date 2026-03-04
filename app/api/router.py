from fastapi import APIRouter

from .routes.health import router as health_router
from .routes.station_meta import router as station_meta_router
from .routes.stations_search import router as stations_search_router
from .routes.station_data import router as station_data_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(station_meta_router)
api_router.include_router(stations_search_router)
api_router.include_router(station_data_router)
