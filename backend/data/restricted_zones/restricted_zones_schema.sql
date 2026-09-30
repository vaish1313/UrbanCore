CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS restricted_zones (
    id SERIAL PRIMARY KEY,
    zone_type VARCHAR(50) NOT NULL,
    source_dataset VARCHAR(100) NOT NULL,
    source_feature_id VARCHAR(255) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restricted_zones_geom 
    ON restricted_zones USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_restricted_zones_type 
    ON restricted_zones (zone_type);

CREATE INDEX IF NOT EXISTS idx_restricted_zones_dataset 
    ON restricted_zones (source_dataset);

-- Uniqueness protection for idempotent loads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'uq_restricted_zones_source'
    ) THEN
        ALTER TABLE restricted_zones 
        ADD CONSTRAINT uq_restricted_zones_source UNIQUE (source_dataset, source_feature_id);
    END IF;
END $$;
