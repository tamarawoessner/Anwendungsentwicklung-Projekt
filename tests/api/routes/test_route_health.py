from fastapi.testclient import TestClient
from app.main import app
from app.api.router import api_router

def test_health_endpoint_ok():
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

def test_api_router_includes_routes():
    # stellt sicher, dass der router nicht leer ist
    assert len(api_router.routes) > 0