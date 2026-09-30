import os
import json
import uuid
import geopandas as gpd
from pathlib import Path
from sqlalchemy import create_engine, text
from geoalchemy2 import Geometry, WKTElement
import pandas as pd
from dotenv import load_dotenv

# Try to load environment variables from .env
load_dotenv(Path(__file__).parent.parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("WARNING: DATABASE_URL environment variable is not set. Cannot load data.")
    exit(1)

# Ensure the dialect is postgresql (e.g. if postgres:// is used)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

DATA_DIR = Path(__file__).parent / 'nashik'

DATASETS = [
    {'file': 'nashik_forests.geojson', 'zone_type': 'FOREST'},
    {'file': 'nashik_rivers.geojson', 'zone_type': 'RIVER'},
    {'file': 'nashik_lakes.geojson', 'zone_type': 'LAKE'},
    {'file': 'nashik_waterbodies.geojson', 'zone_type': 'WATERBODY'},
    {'file': 'nashik_highways.geojson', 'zone_type': 'HIGHWAY'},
]

def generate_stable_id(row, index, dataset_name):
    # Try to find a unique identifier in properties, otherwise fallback to index + dataset hash
    potential_ids = ['id', 'objectid', 'unique_id', 'wbcode']
    for pid in potential_ids:
        if pid in row and pd.notna(row[pid]):
            return str(row[pid])
    return f"{dataset_name}_{index}"

def load_dataset(dataset_info):
    file_path = DATA_DIR / dataset_info['file']
    zone_type = dataset_info['zone_type']
    
    if not file_path.exists():
        print(f"Skipping {file_path.name}: File not found.")
        return
        
    print(f"Loading {file_path.name}...")
    gdf = gpd.read_file(file_path)
    
    if gdf.crs is None or gdf.crs.to_string() != 'EPSG:4326':
        print(f"  Reprojecting to EPSG:4326...")
        gdf = gdf.to_crs('EPSG:4326')
    
    records = []
    skipped = 0
    
    for idx, row in gdf.iterrows():
        geom = row.geometry
        if geom is None or geom.is_empty:
            skipped += 1
            continue
            
        # Extract properties (everything except geometry)
        properties = row.drop('geometry').dropna().to_dict()
        
        # Generate stable feature ID
        feature_id = generate_stable_id(row, idx, dataset_info['file'])
        
        # We pass WKT string to PostGIS and parse it in SQL to avoid psycopg2 adapter issues
        wkt_geom = geom.wkt
        
        records.append({
            'zone_type': zone_type,
            'source_dataset': dataset_info['file'],
            'source_feature_id': feature_id,
            'properties': json.dumps(properties),
            'geometry': wkt_geom
        })
        
    print(f"  Parsed {len(records)} valid geometries (skipped {skipped} empty/invalid).")
    
    if not records:
        return
        
    df = pd.DataFrame(records)
    
    inserted = 0
    duplicate_skips = 0
    
    # Batch insertion using raw SQL to handle unique constraint gracefully (ON CONFLICT DO NOTHING)
    with engine.begin() as conn:
        for index, record in df.iterrows():
            try:
                # Use raw SQL to utilize ON CONFLICT
                sql = text("""
                    INSERT INTO restricted_zones 
                    (zone_type, source_dataset, source_feature_id, properties, geometry)
                    VALUES 
                    (:zone_type, :source_dataset, :source_feature_id, :properties, ST_GeomFromText(:geometry, 4326))
                    ON CONFLICT (source_dataset, source_feature_id) DO NOTHING
                """)
                result = conn.execute(sql, {
                    'zone_type': record['zone_type'],
                    'source_dataset': record['source_dataset'],
                    'source_feature_id': record['source_feature_id'],
                    'properties': record['properties'],
                    'geometry': record['geometry']
                })
                if result.rowcount > 0:
                    inserted += 1
                else:
                    duplicate_skips += 1
            except Exception as e:
                print(f"  Error inserting feature {record['source_feature_id']}: {e}")
                
    print(f"  Done {zone_type}: {inserted} inserted, {duplicate_skips} skipped (duplicate).")

def main():
    print("Starting Restricted Zones Data Load...")
    for ds in DATASETS:
        load_dataset(ds)
    print("Load complete.")

if __name__ == '__main__':
    main()
