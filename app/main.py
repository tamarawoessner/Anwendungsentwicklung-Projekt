import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GHCN Data View API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stations/{id}/years")
def get_stations_years(id: str):
    return {"start_year": 1900, "end_year": 2025}


@app.get("/stations/{id}/info")
def get_stations_info(id: str):
    return {
        "station_id": "GM000012345",
        "name": "FREIBURG",
        "location": {"lat": 47.997, "lon": 7.842},
        "data_start_year": 1901,
        "data_end_year": 2025,
    }


@app.get("/stations/search/")
def search_stations(lat: float, lon: float, radius_km: int):
    return [
        {
            "station_id": "GM000012345",
            "name": "FREIBURG",
            "distance_km": 0.0,
            "location": {"lat": 47.997, "lon": 7.842},
        },
        {
            "station_id": "GM000067890",
            "name": "MUNICH",
            "distance_km": 125.5,
            "location": {"lat": 48.120, "lon": 7.910},
        },
    ]


@app.get("/stations/{id}/data/")
def get_station_data(id: str, start_year: int, end_year: int):
    return {
        "station_id": id,
        "range": {"start_year": start_year, "end_year": end_year},
        "selection": {"YEAR": ["TMIN", "TMAX"], "WINTER": ["TMIN"], "SPRING": ["TMAX"]},
        "yearly": [
            {
                "year": 1990,
                "tmin": 4.21,
                "tmax": 14.88,
            }
        ],
        "winter": [
            {
                "year": 1990,
                "tmin": 0.12,
            }
        ],
        "spring": [
            {
                "year": 1990,
                "tmax": 15.42,
            }
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "false").lower() == "true",
    )
