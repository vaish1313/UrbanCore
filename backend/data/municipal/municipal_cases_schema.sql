CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS municipal_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    polygon_index INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEEDS_REVIEW',
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    compliance_summary JSONB,
    intersection_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_municipal_case UNIQUE (analysis_id, year, polygon_index)
);

CREATE INDEX IF NOT EXISTS idx_municipal_cases_analysis_id ON municipal_cases(analysis_id);
CREATE INDEX IF NOT EXISTS idx_municipal_cases_status ON municipal_cases(status);
CREATE INDEX IF NOT EXISTS idx_municipal_cases_year ON municipal_cases(year);
CREATE INDEX IF NOT EXISTS idx_municipal_cases_geom ON municipal_cases USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_municipal_cases_created_at ON municipal_cases(created_at);
