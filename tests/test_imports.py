def test_import_router():
    from app.api import router
    assert router is not None