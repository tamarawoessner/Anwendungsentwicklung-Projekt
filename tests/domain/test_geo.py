from app.domain.geo import haversine_km


def test_haversine_zero_distance():
    assert haversine_km(0.0, 0.0, 0.0, 0.0) == 0.0


def test_haversine_symmetry():
    d1 = haversine_km(10.0, 20.0, 30.0, 40.0)
    d2 = haversine_km(30.0, 40.0, 10.0, 20.0)
    assert abs(d1 - d2) < 1e-9


def test_haversine_one_degree_lon_equator_approx():
    # 1° Längengrad am Äquator ist ca. 111.195 km (mit Earth radius ~6371 km)
    d = haversine_km(0.0, 0.0, 0.0, 1.0)
    assert 110.5 < d < 112.0


def test_haversine_one_degree_lat_approx():
    # 1° Breitengrad ist ebenfalls ca. 111.195 km
    d = haversine_km(0.0, 0.0, 1.0, 0.0)
    assert 110.5 < d < 112.0