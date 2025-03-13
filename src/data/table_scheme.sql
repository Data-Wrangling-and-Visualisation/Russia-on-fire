-- Schema
CREATE TABLE fires (
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

-- Indexes for common query patterns
CREATE INDEX idx_fires_region ON fires (region_name);
CREATE INDEX idx_fires_year ON fires (year);
CREATE INDEX idx_fires_coords ON fires (latitude, longitude);