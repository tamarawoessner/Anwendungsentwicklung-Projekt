-- schema.sql
-- Baseline schema for GHCN-Daily exploration (stations + inventory + yearly & seasonal aggregates)
-- Target DB: PostgreSQL 16+

BEGIN;

-- Optional: keep everything in its own schema
CREATE SCHEMA IF NOT EXISTS ghcn;
SET search_path TO ghcn, public;

-- ---------- Types ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'season') THEN
    CREATE TYPE season AS ENUM ('WINTER','SPRING','SUMMER','AUTUMN');
  END IF;
END $$;

-- ---------- Core tables ----------

-- Stations metadata from ghcnd-stations.txt
CREATE TABLE IF NOT EXISTS stations (
  station_id    VARCHAR(11) PRIMARY KEY,          -- e.g. "GM000012345"
  lat           DOUBLE PRECISION NOT NULL,
  lon           DOUBLE PRECISION NOT NULL,
  elevation_m   DOUBLE PRECISION,
  state         VARCHAR(2),
  name          TEXT NOT NULL,
  gsn_flag      VARCHAR(3),
  hcn_crn_flag  VARCHAR(3),
  wmo_id        VARCHAR(5),

  -- small sanity checks
  CONSTRAINT chk_station_lat CHECK (lat BETWEEN -90 AND 90),
  CONSTRAINT chk_station_lon CHECK (lon BETWEEN -180 AND 180)
);

-- Inventory from ghcnd-inventory.txt
-- One row per station + element (TMIN/TMAX/PRCP/...)
CREATE TABLE IF NOT EXISTS inventory (
  station_id  VARCHAR(11) NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
  element     VARCHAR(4)  NOT NULL,               -- e.g. TMIN, TMAX
  first_year  INT         NOT NULL,
  last_year   INT         NOT NULL,

  CONSTRAINT pk_inventory PRIMARY KEY (station_id, element),
  CONSTRAINT chk_inventory_years CHECK (first_year BETWEEN 1700 AND 2500
                                        AND last_year BETWEEN 1700 AND 2500
                                        AND first_year <= last_year)
);

-- Aggregated values per year (for fast UC3 "Year" view)
CREATE TABLE IF NOT EXISTS year_agg (
  station_id            VARCHAR(11) NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
  year                  INT NOT NULL,

  -- Means in °C (already converted from tenths-of-°C)
  tmin_mean_c           REAL,
  tmax_mean_c           REAL,

  -- Coverage / data gap transparency
  tmin_days_present     INT NOT NULL DEFAULT 0,
  tmin_days_expected    INT NOT NULL,
  tmax_days_present     INT NOT NULL DEFAULT 0,
  tmax_days_expected    INT NOT NULL,

  CONSTRAINT pk_year_agg PRIMARY KEY (station_id, year),
  CONSTRAINT chk_year CHECK (year BETWEEN 1700 AND 2500),
  CONSTRAINT chk_year_agg_counts CHECK (
    tmin_days_present BETWEEN 0 AND tmin_days_expected
    AND tmax_days_present BETWEEN 0 AND tmax_days_expected
  )
);

-- Aggregated values per meteorological season (for fast UC3 "Seasons" view)
CREATE TABLE IF NOT EXISTS season_agg (
  station_id            VARCHAR(11) NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
  year                  INT NOT NULL,
  season                season NOT NULL,

  tmin_mean_c           REAL,
  tmax_mean_c           REAL,

  tmin_days_present     INT NOT NULL DEFAULT 0,
  tmin_days_expected    INT NOT NULL,
  tmax_days_present     INT NOT NULL DEFAULT 0,
  tmax_days_expected    INT NOT NULL,

  CONSTRAINT pk_season_agg PRIMARY KEY (station_id, year, season),
  CONSTRAINT chk_season_year CHECK (year BETWEEN 1700 AND 2500),
  CONSTRAINT chk_season_agg_counts CHECK (
    tmin_days_present BETWEEN 0 AND tmin_days_expected
    AND tmax_days_present BETWEEN 0 AND tmax_days_expected
  )
);

-- Meta info about imports / dataset snapshots
CREATE TABLE IF NOT EXISTS dataset_meta (
  id            BIGSERIAL PRIMARY KEY,
  dataset_name  TEXT NOT NULL,     -- e.g. "GHCN-Daily"
  dataset_version TEXT,            -- optional: e.g. date string, git tag, etc.
  imported_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_note   TEXT
);

-- ---------- Helpful indexes ----------
-- for station search (bounding box / quick filter by lat/lon)
CREATE INDEX IF NOT EXISTS idx_stations_lat ON stations(lat);
CREATE INDEX IF NOT EXISTS idx_stations_lon ON stations(lon);

-- query patterns for charts
CREATE INDEX IF NOT EXISTS idx_year_agg_station_year ON year_agg(station_id, year);
CREATE INDEX IF NOT EXISTS idx_season_agg_station_year ON season_agg(station_id, year);

-- ---------- Optional views (nice for API) ----------
-- Coverage as ratio (0..1). Null-safe division.
CREATE OR REPLACE VIEW v_year_agg AS
SELECT
  station_id,
  year,
  tmin_mean_c,
  tmax_mean_c,
  tmin_days_present,
  tmin_days_expected,
  CASE WHEN tmin_days_expected > 0 THEN (tmin_days_present::double precision / tmin_days_expected) ELSE NULL END AS tmin_coverage,
  tmax_days_present,
  tmax_days_expected,
  CASE WHEN tmax_days_expected > 0 THEN (tmax_days_present::double precision / tmax_days_expected) ELSE NULL END AS tmax_coverage
FROM year_agg;

CREATE OR REPLACE VIEW v_season_agg AS
SELECT
  station_id,
  year,
  season,
  tmin_mean_c,
  tmax_mean_c,
  tmin_days_present,
  tmin_days_expected,
  CASE WHEN tmin_days_expected > 0 THEN (tmin_days_present::double precision / tmin_days_expected) ELSE NULL END AS tmin_coverage,
  tmax_days_present,
  tmax_days_expected,
  CASE WHEN tmax_days_expected > 0 THEN (tmax_days_present::double precision / tmax_days_expected) ELSE NULL END AS tmax_coverage
FROM season_agg;

COMMIT;
