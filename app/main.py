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


@app.get("/stations/{id}")
def get_stations_years(id: str):
    return {"start_year": 1900, "end_year": 2025}


@app.get("/stations/search/")
def search_stations(lat: float, lon: float, radius_km: int):
    return [
        {"id": "STATION_1", "name": "Station 1", "lat": lat + 0.1, "lon": lon + 0.1},
        {"id": "STATION_2", "name": "Station 2", "lat": lat - 0.1, "lon": lon - 0.1},
    ]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "false").lower() == "true",
    )
