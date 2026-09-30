import os
import geopandas as gpd
import pandas as pd
from pathlib import Path
from shapely.geometry import shape
from shapely.validation import make_valid

# Setup paths
raw_dir = Path('backend/data/restricted_zones/raw')
boundary_path = Path('backend/data/restricted_zones/boundary/nashik_district_boundary.geojson')
out_dir = Path('backend/data/restricted_zones/nashik')
out_dir.mkdir(parents=True, exist_ok=True)

# Function to fix and report geometries
def fix_geometries(gdf, name):
    initial_invalid = (~gdf.is_valid).sum()
    if initial_invalid > 0:
        print(f'  [{name}] Found {initial_invalid} invalid geometries. Repairing...')
        gdf.geometry = gdf.geometry.apply(lambda geom: make_valid(geom) if geom is not None else geom)
    return gdf, initial_invalid

# Load Boundary
print('Loading Nashik Boundary...')
boundary_gdf = gpd.read_file(boundary_path)
boundary_crs = boundary_gdf.crs

results = []

def process_dataset(name, filename, out_filename, use_clip=True, filter_col=None, filter_val=None):
    print(f'\nProcessing {name}...')
    filepath = raw_dir / filename
    gdf = gpd.read_file(filepath)
    orig_count = len(gdf)
    
    # Optional Attribute Filter to speed up
    if filter_col and filter_col in gdf.columns:
        gdf = gdf[gdf[filter_col].astype(str).str.contains(filter_val, case=False, na=False)]
        print(f'  Attribute filter applied, reduced to {len(gdf)} features.')

    gdf, invalid_count = fix_geometries(gdf, name)
    
    if gdf.crs != boundary_crs:
        gdf = gdf.to_crs(boundary_crs)
    
    if use_clip:
        # Spatial Clip
        clipped = gpd.clip(gdf, boundary_gdf)
    else:
        clipped = gdf
        
    final_count = len(clipped)
    
    # Save as 4326
    if clipped.crs.to_string() != 'EPSG:4326':
        clipped = clipped.to_crs('EPSG:4326')
        
    out_path = out_dir / out_filename
    if final_count > 0:
        clipped.to_file(out_path, driver='GeoJSON')
    
    empty_count = (clipped.geometry.is_empty | clipped.geometry.isna()).sum()
    
    results.append({
        'Dataset': name,
        'Source': filename,
        'Output Path': str(out_path),
        'Original Features': orig_count,
        'Final Features': final_count,
        'Invalid Repaired': invalid_count,
        'Empty Geometries': empty_count,
        'Geometry Types': str(clipped.geom_type.unique().tolist()) if final_count > 0 else 'None',
        'CRS': str(clipped.crs),
        'Bounds': str(clipped.total_bounds) if final_count > 0 else 'None'
    })
    
    return clipped

# 1. Forests
process_dataset('Forests', 'SOI_Forests.geojson', 'nashik_forests.geojson')

# 3. Highways
process_dataset('Highways', 'gs_highways.geojson', 'nashik_highways.geojson')

# 4. Lakes
process_dataset('Lakes', 'wris_lakes.geojson', 'nashik_lakes.geojson', filter_col='district', filter_val='Nashik')

# 5. Waterbodies
process_dataset('Waterbodies', 'wris_waterbodies.geojson', 'nashik_waterbodies.geojson', filter_col='district', filter_val='Nashik')

# 2. Rivers (Special Merge)
print('\nProcessing Rivers (Merge)...')
river1_path = raw_dir / 'wris_river_polygons.geojson'
river2_path = raw_dir / 'river_polygon.GeoJSON'

r1 = gpd.read_file(river1_path)
r1_orig = len(r1)
r1, inv1 = fix_geometries(r1, 'wris_river_polygons')
if r1.crs != boundary_crs: r1 = r1.to_crs(boundary_crs)
r1_clipped = gpd.clip(r1, boundary_gdf)
r1_clipped['source_dataset'] = 'wris_river_polygons.geojson'

r2 = gpd.read_file(river2_path)
r2_orig = len(r2)
r2, inv2 = fix_geometries(r2, 'river_polygon')
if r2.crs != boundary_crs: r2 = r2.to_crs(boundary_crs)
r2_clipped = gpd.clip(r2, boundary_gdf)
r2_clipped['source_dataset'] = 'river_polygon.GeoJSON'

print(f'  wris_river_polygons in Nashik: {len(r1_clipped)}')
print(f'  river_polygon in Nashik: {len(r2_clipped)}')

# Deduplication Logic
duplicates = 0
r1_keep = []
for idx, row in r1_clipped.iterrows():
    geom1 = row.geometry
    if geom1 is None or geom1.is_empty: continue
    
    # Check intersection with r2
    intersections = r2_clipped[r2_clipped.intersects(geom1)]
    is_duplicate = False
    for _, r2_row in intersections.iterrows():
        geom2 = r2_row.geometry
        if geom2 is None or geom2.is_empty: continue
        
        try:
            intersection_area = geom1.intersection(geom2).area
            # If intersection is more than 80% of the smaller geometry, consider it a duplicate
            if intersection_area / min(geom1.area, geom2.area) > 0.8:
                is_duplicate = True
                break
        except Exception:
            pass
    
    if is_duplicate:
        duplicates += 1
    else:
        r1_keep.append(row)

print(f'  Found {duplicates} duplicate river features across sources.')
if len(r1_keep) > 0:
    r1_unique = gpd.GeoDataFrame(r1_keep, crs=boundary_crs)
    # Ensure they have matching CRSs before concat
    rivers_merged = pd.concat([r1_unique, r2_clipped], ignore_index=True)
else:
    rivers_merged = r2_clipped
    
rivers_merged = gpd.GeoDataFrame(rivers_merged, geometry='geometry', crs=boundary_crs)
final_rivers_count = len(rivers_merged)

if rivers_merged.crs.to_string() != 'EPSG:4326':
    rivers_merged = rivers_merged.to_crs('EPSG:4326')

out_river = out_dir / 'nashik_rivers.geojson'
rivers_merged.to_file(out_river, driver='GeoJSON')
empty_rivers = (rivers_merged.geometry.is_empty | rivers_merged.geometry.isna()).sum()

results.append({
    'Dataset': 'Rivers',
    'Source': 'wris_river_polygons + river_polygon',
    'Output Path': str(out_river),
    'Original Features': f'{r1_orig} + {r2_orig}',
    'Final Features': final_rivers_count,
    'Invalid Repaired': f'{inv1} + {inv2}',
    'Empty Geometries': empty_rivers,
    'Geometry Types': str(rivers_merged.geom_type.unique().tolist()),
    'CRS': str(rivers_merged.crs),
    'Bounds': str(rivers_merged.total_bounds)
})

print('\n=== VALIDATION REPORT ===')
for r in results:
    print(f'\nDataset: {r["Dataset"]}')
    print(f'Source: {r["Source"]}')
    print(f'Original Features: {r["Original Features"]}')
    print(f'Final Features: {r["Final Features"]}')
    print(f'Invalid Repaired: {r["Invalid Repaired"]}')
    print(f'Empty Geometries: {r["Empty Geometries"]}')
    print(f'Geometry Types: {r["Geometry Types"]}')
    print(f'CRS: {r["CRS"]}')
    print(f'Bounds: {r["Bounds"]}')
    print(f'Output Path: {r["Output Path"]}')
