# db_init.py
import os
import zipfile

import pandas as pd
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values

load_dotenv()

# Configuration
ZIP_PATH = "data/data.zip"
CSV_NAME = "data_fires.csv"
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS fires (
    fire_id SERIAL PRIMARY KEY,
    region_name TEXT NOT NULL,
    year INTEGER,
    fire_type TEXT CHECK (fire_type IN ('Лесные', 'Нелесные')),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    landmark_distance NUMERIC(7,2),
    date_beginning DATE,
    area_beginning INTEGER,
    date_end DATE,
    current_state TEXT,
    area_total INTEGER,
    area_forest INTEGER,
    area_fund_total INTEGER,
    area_fund_forest INTEGER
);

CREATE INDEX IF NOT EXISTS idx_fires_region ON fires (region_name);
CREATE INDEX IF NOT EXISTS idx_fires_year ON fires (year);
CREATE INDEX IF NOT EXISTS idx_fires_coords ON fires (latitude, longitude);
"""

db_config = {
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}


def table_is_empty(cursor):
    cursor.execute("SELECT COUNT(*) FROM fires")
    return cursor.fetchone()[0] == 0


def main():
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()

    try:
        # Create schema
        cursor.execute(SCHEMA_SQL)
        conn.commit()

        # Load data only if table is empty
        if table_is_empty(cursor):
            print("Loading initial data from ZIP...")

            # Extract CSV from ZIP
            with zipfile.ZipFile(ZIP_PATH, "r") as z:
                with z.open(CSV_NAME) as f:
                    df = pd.read_csv(f, delimiter=";")

            # Data cleaning
            df["date_beginning"] = pd.to_datetime(
                df["date_beginning"], format="%d.%m.%Y", errors="coerce"
            )
            df["date_end"] = pd.to_datetime(
                df["date_end"], format="%d.%m.%Y", errors="coerce"
            )

            df = df.drop(
                columns=[
                    "oktmo",
                    "okato",
                    "zone_beginning",
                    "code",
                    "landmark_settlement",
                    "landmark_azimuth",
                    "forestry",
                    "comment",
                    "zone",
                ]
            ).rename(columns={"region": "region_name", "type": "fire_type"})

            # Prepare data
            data_tuples = [tuple(row) for row in df.to_numpy()]

            # Insert data
            execute_values(
                cursor,
                """
                INSERT INTO fires (
                    region_name, year, fire_type, latitude, longitude,
                    landmark_distance, date_beginning, area_beginning,
                    date_end, current_state, area_total, area_forest,
                    area_fund_total, area_fund_forest
                ) VALUES %s
            """,
                data_tuples,
            )

            conn.commit()
            print(f"Inserted {len(data_tuples)} records")

    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
