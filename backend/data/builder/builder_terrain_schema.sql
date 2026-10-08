-- Builder Phase 2, Step 2: DEM-derived terrain metrics.
-- One row per existing builder_aois record; no duplicate AOI geometry is stored.

CREATE TABLE IF NOT EXISTS builder_aoi_terrain (
    id                    BIGSERIAL PRIMARY KEY,
    aoi_id                TEXT NOT NULL REFERENCES builder_aois(id) ON DELETE CASCADE,
    mean_elevation_m      DOUBLE PRECISION NOT NULL,
    min_elevation_m       DOUBLE PRECISION NOT NULL,
    max_elevation_m       DOUBLE PRECISION NOT NULL,
    mean_slope_deg        DOUBLE PRECISION NOT NULL CHECK (mean_slope_deg >= 0),
    max_slope_deg         DOUBLE PRECISION NOT NULL CHECK (max_slope_deg >= mean_slope_deg),
    flat_land_percentage   DOUBLE PRECISION NOT NULL CHECK (flat_land_percentage BETWEEN 0 AND 100),
    terrain_roughness_m    DOUBLE PRECISION NOT NULL CHECK (terrain_roughness_m >= 0),
    dem_source             TEXT NOT NULL,
    calculated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT builder_aoi_terrain_aoi_unique UNIQUE (aoi_id),
    CONSTRAINT builder_aoi_terrain_elevation_order CHECK (
        min_elevation_m <= mean_elevation_m AND mean_elevation_m <= max_elevation_m
    )
);

CREATE INDEX IF NOT EXISTS builder_aoi_terrain_aoi_id_idx
    ON builder_aoi_terrain (aoi_id);
