-- ============================================================
-- UrbanCore — PostgreSQL Initialization Script
-- Extensions: PostGIS, pgvector, uuid-ossp
-- Run automatically on first postgres container start.
-- ============================================================

-- Core extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
CREATE EXTENSION IF NOT EXISTS vector;           -- pgvector for embeddings

-- ─── Schemas ─────────────────────────────────────────────────
-- Separate schemas enforce bounded contexts at the DB level
CREATE SCHEMA IF NOT EXISTS analysis;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS terrain;
CREATE SCHEMA IF NOT EXISTS intelligence;

-- ─── Enums ───────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('citizen', 'owner', 'builder', 'municipal', 'admin');
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE public.change_type AS ENUM ('new_construction', 'demolished', 'modified', 'no_change');
CREATE TYPE public.zone_type AS ENUM ('protected', 'residential', 'commercial', 'agricultural', 'industrial', 'mixed_use', 'heritage', 'forest', 'water_body');
CREATE TYPE public.violation_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.report_format AS ENUM ('json', 'pdf', 'html');
CREATE TYPE public.imagery_source AS ENUM ('sentinel2', 'naip', 'custom');

-- ─── Analysis Schema ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis.jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,
    project_id      UUID,
    name            TEXT NOT NULL,
    description     TEXT,
    aoi             GEOMETRY(Polygon, 4326) NOT NULL,   -- Area of Interest (WGS84)
    epochs          TEXT[] NOT NULL DEFAULT '{}',        -- e.g. ['2022-Q1', '2024-Q1']
    status          public.job_status NOT NULL DEFAULT 'pending',
    progress        SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    error_message   TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS analysis.footprints (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL REFERENCES analysis.jobs(id) ON DELETE CASCADE,
    geometry        GEOMETRY(Polygon, 4326) NOT NULL,
    confidence      FLOAT NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    source_epoch    TEXT NOT NULL,
    area_sqm        FLOAT,                              -- Computed from geometry
    perimeter_m     FLOAT,
    model_version   TEXT NOT NULL,
    refined_by_sam  BOOLEAN NOT NULL DEFAULT FALSE,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis.change_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id              UUID NOT NULL REFERENCES analysis.jobs(id) ON DELETE CASCADE,
    footprint_before_id UUID REFERENCES analysis.footprints(id),
    footprint_after_id  UUID REFERENCES analysis.footprints(id),
    change_type         public.change_type NOT NULL,
    location            GEOMETRY(Point, 4326),          -- Centroid of change
    delta_area_sqm      FLOAT,                          -- Positive=growth, Negative=shrinkage
    epoch_before        TEXT,
    epoch_after         TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Compliance Schema ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance.zones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    zone_type       public.zone_type NOT NULL,
    geometry        GEOMETRY(MultiPolygon, 4326) NOT NULL,
    source_dataset  TEXT NOT NULL,                      -- e.g. 'OSM', 'Municipal-2024'
    jurisdiction    TEXT,
    effective_date  DATE,
    expiry_date     DATE,
    restrictions    JSONB NOT NULL DEFAULT '{}',        -- Zone-specific rules
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance.violations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL REFERENCES analysis.jobs(id) ON DELETE CASCADE,
    footprint_id    UUID NOT NULL REFERENCES analysis.footprints(id) ON DELETE CASCADE,
    zone_id         UUID NOT NULL REFERENCES compliance.zones(id),
    violation_type  TEXT NOT NULL,                      -- e.g. 'BUILDING_IN_PROTECTED_ZONE'
    severity        public.violation_severity NOT NULL,
    overlap_area_sqm FLOAT,
    description     TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Terrain Schema ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS terrain.profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL REFERENCES analysis.jobs(id) ON DELETE CASCADE,
    aoi             GEOMETRY(Polygon, 4326) NOT NULL,
    dem_source      TEXT NOT NULL DEFAULT 'SRTM-30m',
    -- Elevation stats
    elev_min_m      FLOAT,
    elev_max_m      FLOAT,
    elev_mean_m     FLOAT,
    elev_std_m      FLOAT,
    -- Slope stats (degrees)
    slope_min_deg   FLOAT,
    slope_max_deg   FLOAT,
    slope_mean_deg  FLOAT,
    slope_std_deg   FLOAT,
    -- Roughness (terrain ruggedness index)
    roughness_mean  FLOAT,
    roughness_max   FLOAT,
    -- Derived assessments
    suitability_score FLOAT CHECK (suitability_score BETWEEN 0 AND 1),
    suitability_class TEXT,                             -- 'unsuitable'|'marginal'|'suitable'|'highly_suitable'
    -- Raster file references (stored in object storage)
    slope_raster_url    TEXT,
    hillshade_raster_url TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Intelligence Schema ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence.policy_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    jurisdiction    TEXT NOT NULL,
    document_type   TEXT NOT NULL,                      -- e.g. 'zoning_act', 'building_code', 'env_regulation'
    content         TEXT NOT NULL,
    source_url      TEXT,
    effective_date  DATE,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intelligence.document_chunks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES intelligence.policy_documents(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,
    content         TEXT NOT NULL,
    embedding       vector(768),                        -- pgvector embedding (nomic-embed-text dim)
    token_count     INTEGER,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS intelligence.reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL REFERENCES analysis.jobs(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    user_role       public.user_role NOT NULL,
    format          public.report_format NOT NULL DEFAULT 'json',
    sections        JSONB NOT NULL DEFAULT '[]',        -- Ordered report sections
    file_url        TEXT,                               -- PDF/HTML stored in object storage
    token_cost      INTEGER,                            -- LLM token usage for auditing
    model_used      TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Spatial Indexes ─────────────────────────────────────────
-- GIST indexes for all geometry columns (mandatory for PostGIS performance)
CREATE INDEX IF NOT EXISTS idx_jobs_aoi ON analysis.jobs USING GIST(aoi);
CREATE INDEX IF NOT EXISTS idx_footprints_geom ON analysis.footprints USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_change_records_location ON analysis.change_records USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_zones_geom ON compliance.zones USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_terrain_aoi ON terrain.profiles USING GIST(aoi);

-- ─── Standard Indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON analysis.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON analysis.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON analysis.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_footprints_job_id ON analysis.footprints(job_id);
CREATE INDEX IF NOT EXISTS idx_footprints_epoch ON analysis.footprints(source_epoch);
CREATE INDEX IF NOT EXISTS idx_violations_job_id ON compliance.violations(job_id);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON compliance.violations(severity);
CREATE INDEX IF NOT EXISTS idx_reports_job_id ON intelligence.reports(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON intelligence.reports(user_id);

-- ─── pgvector Index (HNSW — best for cosine similarity search) ──
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON intelligence.document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ─── Trigger: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON analysis.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_zones_updated_at
    BEFORE UPDATE ON compliance.zones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Computed footprint area on insert ───────────────────────
CREATE OR REPLACE FUNCTION analysis.compute_footprint_metrics()
RETURNS TRIGGER AS $$
BEGIN
    NEW.area_sqm    = ST_Area(NEW.geometry::geography);
    NEW.perimeter_m = ST_Perimeter(NEW.geometry::geography);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_footprint_metrics
    BEFORE INSERT OR UPDATE ON analysis.footprints
    FOR EACH ROW EXECUTE FUNCTION analysis.compute_footprint_metrics();

-- Done
SELECT 'UrbanCore database initialized successfully.' AS status;
