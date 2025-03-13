import os

import pandas as pd
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values

load_dotenv()


db_config = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}

# Connect to PostgreSQL
conn = psycopg2.connect(**db_config)
cursor = conn.cursor()

# Load CSV into a Pandas DataFrame
csv_file = "data/data_fires.csv"
df = pd.read_csv(csv_file, delimiter=";")

# Clean data
df["date_beginning"] = pd.to_datetime(
    df["date_beginning"], format="%d.%m.%Y", errors="coerce"
)
df["date_end"] = pd.to_datetime(df["date_end"], format="%d.%m.%Y", errors="coerce")

# Drop unnecessary columns
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
)

# Rename columns to match the database schema
df = df.rename(
    columns={
        "region": "region_name",
        "type": "fire_type",
        "latitude": "latitude",
        "longitude": "longitude",
        "landmark_distance": "landmark_distance",
        "date_beginning": "date_beginning",
        "area_beginning": "area_beginning",
        "date_end": "date_end",
        "current_state": "current_state",
        "area_total": "area_total",
        "area_forest": "area_forest",
        "area_fund_total": "area_fund_total",
        "area_fund_forest": "area_fund_forest",
    }
)

# Convert DataFrame to a list of tuples for bulk insertion
data_tuples = [tuple(row) for row in df.to_numpy()]

# Insert data into the database
insert_query = """
INSERT INTO fires (
    region_name, year, fire_type, latitude, longitude,
    landmark_distance, date_beginning, area_beginning,
    date_end, current_state, area_total, area_forest,
    area_fund_total, area_fund_forest
) VALUES %s
"""

# Use execute_values for efficient bulk insertion
execute_values(cursor, insert_query, data_tuples)

# Commit and close the connection
conn.commit()
cursor.close()
conn.close()

print("Data insertion completed successfully!")
