from unittest.mock import patch


@patch("app.infrastructure.db.connection.psycopg.connect")
def test_connect_to_db_calls_psycopg_with_expected_params(mock_connect):
    # import inside test so module-level constants are loaded normally
    from app.infrastructure.db.connection import connect_to_db, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

    mock_connect.return_value = object()

    conn = connect_to_db()

    assert conn is mock_connect.return_value
    mock_connect.assert_called_once_with(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


@patch("app.infrastructure.db.connection.psycopg.connect", side_effect=Exception("boom"))
def test_connect_to_db_returns_none_on_error(mock_connect):
    from app.infrastructure.db.connection import connect_to_db

    conn = connect_to_db()
    assert conn is None