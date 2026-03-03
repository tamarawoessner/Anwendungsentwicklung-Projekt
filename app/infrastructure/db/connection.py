import psycopg
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection settings
DB_HOST = "db"
DB_PORT = 5432
DB_NAME = "app"
DB_USER = "app"
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")


# Connect to PostgreSQL
def connect_to_db():
    try:
        conn = psycopg.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


if __name__ == "__main__":
    pass
