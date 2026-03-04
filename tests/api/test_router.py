from app.api.router import api_router


def test_api_router_has_routes():
    # Sollte mehrere Routen enthalten (health + station meta/search/data)
    assert len(api_router.routes) >= 4


def test_api_router_includes_health_route_path():
    paths = {getattr(r, "path", None) for r in api_router.routes}
    assert "/health" in paths