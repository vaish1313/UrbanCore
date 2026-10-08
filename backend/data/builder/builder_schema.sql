-- =============================================================================
-- Builder AOI Schema
-- Table: builder_aois
-- Purpose: Stores all predefined Areas of Interest for the Builder Dashboard.
--          Geometry is stored as PostGIS Polygon (SRID 4326).
-- =============================================================================

-- Require PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Main AOI table
CREATE TABLE IF NOT EXISTS builder_aois (
    -- Slug identifier matching frontend nashikAois.ts id strings
    id                         TEXT PRIMARY KEY,

    -- Display fields
    name                       TEXT        NOT NULL,
    location                   TEXT,
    village                    TEXT,
    taluka                     TEXT,
    district                   TEXT        NOT NULL DEFAULT 'Nashik',
    category                   TEXT        NOT NULL CHECK (category IN ('residential','commercial','industrial','protected','highway','dam')),

    -- Municipal monitoring status (green/yellow/red)
    status                     TEXT        NOT NULL CHECK (status IN ('green','yellow','red')),

    -- Point centre coordinates (for quick lookups, map pinning)
    lat                        DOUBLE PRECISION NOT NULL,
    lng                        DOUBLE PRECISION NOT NULL,

    -- Canvas-relative percentage coordinates (x, y) used by the district map overlay
    map_x                      SMALLINT,
    map_y                      SMALLINT,

    -- Polygon geometry (SRID 4326 = WGS84)
    geometry                   GEOMETRY(POLYGON, 4326),

    -- Suitability & scoring
    suitability_score          SMALLINT    NOT NULL CHECK (suitability_score BETWEEN 0 AND 100),
    accessibility_score        SMALLINT    NOT NULL CHECK (accessibility_score BETWEEN 0 AND 100),
    water_availability_score   SMALLINT    NOT NULL CHECK (water_availability_score BETWEEN 0 AND 100),
    environmental_risk_score   SMALLINT    NOT NULL CHECK (environmental_risk_score BETWEEN 0 AND 100),
    development_potential_score SMALLINT   NOT NULL CHECK (development_potential_score BETWEEN 0 AND 100),

    -- Terrain metrics
    elevation                  REAL        NOT NULL,
    slope                      REAL        NOT NULL,
    roughness                  TEXT        NOT NULL,
    flat_land_percent          REAL        NOT NULL CHECK (flat_land_percent BETWEEN 0 AND 100),
    readiness                  TEXT        NOT NULL CHECK (readiness IN ('HIGH','MEDIUM','LOW')),

    -- Environmental constraints (percentages 0-100)
    flood_zone_overlap_pct     REAL        NOT NULL DEFAULT 0,
    forest_boundary_overlap_pct REAL       NOT NULL DEFAULT 0,
    green_belt_overlap_pct     REAL        NOT NULL DEFAULT 0,
    protected_area_overlap_pct REAL        NOT NULL DEFAULT 0,
    environmental_restriction  TEXT        NOT NULL CHECK (environmental_restriction IN ('Low','Moderate','High','Critical')),

    -- Estimated construction footprint (from satellite intelligence)
    estimated_construction_area_sqm REAL,

    -- Human-readable site summary
    summary                    TEXT,

    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Construction history table (one row per AOI per year)
CREATE TABLE IF NOT EXISTS builder_aoi_construction_history (
    id                  SERIAL PRIMARY KEY,
    aoi_id              TEXT        NOT NULL REFERENCES builder_aois(id) ON DELETE CASCADE,
    year                SMALLINT    NOT NULL,
    buildings_count     INTEGER     NOT NULL,
    built_up_change_pct REAL        NOT NULL,

    UNIQUE (aoi_id, year)
);

-- Spatial index on geometry for fast ST_DWithin / ST_Intersects queries
CREATE INDEX IF NOT EXISTS builder_aois_geometry_gist
    ON builder_aois USING GIST (geometry);

-- Index for text searches on name/village
CREATE INDEX IF NOT EXISTS builder_aois_name_idx
    ON builder_aois (lower(name));

-- Index on category for filter queries
CREATE INDEX IF NOT EXISTS builder_aois_category_idx
    ON builder_aois (category);

-- Index on status for the municipal map overlay
CREATE INDEX IF NOT EXISTS builder_aois_status_idx
    ON builder_aois (status);

-- Index on aoi_id for history lookups
CREATE INDEX IF NOT EXISTS builder_aoi_history_aoi_id_idx
    ON builder_aoi_construction_history (aoi_id);
