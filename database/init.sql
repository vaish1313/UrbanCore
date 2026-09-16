-- UrbanCore Database Initialization Script
-- PostgreSQL with PostGIS

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial violation types
INSERT INTO violation_types (name, code, description, severity, buffer_distance_m, penalty_description) VALUES
('River Buffer Violation', 'RIVER_BUF', 'Construction within river buffer zone', 'high', 100.0, 'Demolition and fine up to ₹5,00,000'),
('Flood Zone Violation', 'FLOOD_ZONE', 'Construction in designated flood zone', 'critical', NULL, 'Immediate evacuation order and demolition'),
('Forest Boundary Violation', 'FOREST_BND', 'Construction within forest boundary', 'critical', 50.0, 'Demolition, fine, and legal action under Forest Act'),
('Green Belt Violation', 'GREEN_BELT', 'Construction in protected green belt area', 'high', NULL, 'Demolition and fine up to ₹10,00,000'),
('CRZ Violation', 'CRZ', 'Construction in Coastal Regulation Zone', 'critical', NULL, 'Demolition and fine under CRZ Notification'),
('Protected Area Violation', 'PROTECTED', 'Construction in protected heritage/ecological area', 'critical', NULL, 'Demolition and heavy fines'),
('Road Setback Violation', 'ROAD_SETBACK', 'Insufficient setback from road', 'medium', 5.0, 'Modification order and fine up to ₹2,00,000'),
('Municipal Zoning Violation', 'MUNI_ZONE', 'Violation of municipal zoning regulations', 'medium', NULL, 'Fine and modification order')
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_aois_project ON aois(project_id);
CREATE INDEX IF NOT EXISTS idx_aois_geometry ON aois USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_satellite_images_project ON satellite_images(project_id);
CREATE INDEX IF NOT EXISTS idx_satellite_images_year ON satellite_images(year);
CREATE INDEX IF NOT EXISTS idx_predictions_project ON predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_predictions_image ON predictions(image_id);
CREATE INDEX IF NOT EXISTS idx_buildings_project ON buildings(project_id);
CREATE INDEX IF NOT EXISTS idx_buildings_geometry ON buildings USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_buildings_year ON buildings(detected_year);
CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings(status);
CREATE INDEX IF NOT EXISTS idx_violations_project ON violations(project_id);
CREATE INDEX IF NOT EXISTS idx_violations_building ON violations(building_id);
CREATE INDEX IF NOT EXISTS idx_violations_type ON violations(violation_type_id);
CREATE INDEX IF NOT EXISTS idx_terrain_project ON terrain_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_terrain_geometry ON terrain_analyses USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_complaints_project ON complaints(project_id);
CREATE INDEX IF NOT EXISTS idx_complaints_number ON complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_project ON job_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON job_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);

-- Create materialized view for project statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS project_statistics AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(DISTINCT b.id) as total_buildings,
    COUNT(DISTINCT CASE WHEN b.status = 'new' THEN b.id END) as new_buildings,
    COUNT(DISTINCT CASE WHEN b.status = 'removed' THEN b.id END) as removed_buildings,
    COUNT(DISTINCT CASE WHEN b.status = 'expanded' THEN b.id END) as expanded_buildings,
    COUNT(DISTINCT v.id) as total_violations,
    SUM(CASE WHEN v.severity = 'low' THEN 1 ELSE 0 END) as low_severity_violations,
    SUM(CASE WHEN v.severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_violations,
    SUM(CASE WHEN v.severity = 'high' THEN 1 ELSE 0 END) as high_severity_violations,
    SUM(CASE WHEN v.severity = 'critical' THEN 1 ELSE 0 END) as critical_severity_violations,
    SUM(b.area_sqm) as total_building_area_sqm,
    AVG(b.area_sqm) as avg_building_area_sqm
FROM projects p
LEFT JOIN buildings b ON p.id = b.project_id
LEFT JOIN violations v ON b.id = v.building_id
GROUP BY p.id, p.name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_stats_project_id ON project_statistics(project_id);

-- Function to refresh project statistics
CREATE OR REPLACE FUNCTION refresh_project_statistics()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_statistics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-refresh statistics
CREATE TRIGGER refresh_stats_on_building_change
AFTER INSERT OR UPDATE OR DELETE ON buildings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_project_statistics();

CREATE TRIGGER refresh_stats_on_violation_change
AFTER INSERT OR UPDATE OR DELETE ON violations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_project_statistics();

-- Function to calculate area in square meters from geometry
CREATE OR REPLACE FUNCTION calculate_area_sqm(geom geometry)
RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Area(ST_Transform(geom, 3857));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate distance in meters between two geometries
CREATE OR REPLACE FUNCTION calculate_distance_m(geom1 geometry, geom2 geometry)
RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Distance(ST_Transform(geom1, 3857), ST_Transform(geom2, 3857));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if geometry intersects with buffer
CREATE OR REPLACE FUNCTION intersects_buffer(geom1 geometry, geom2 geometry, buffer_m float)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN ST_Intersects(
        ST_Transform(geom1, 3857),
        ST_Buffer(ST_Transform(geom2, 3857), buffer_m)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON DATABASE urbancore IS 'UrbanCore - AI-powered geospatial platform for illegal construction detection';
