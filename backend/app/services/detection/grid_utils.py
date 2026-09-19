"""
Grid utilities for generating canonical analysis cells.
"""
from typing import Tuple
from pyproj import Transformer

# UTM Zone 43N is used for Nashik, Maharashtra
# EPSG:32643
UTM_CRS = "EPSG:32643"
WGS84_CRS = "EPSG:4326"

# Transformers
to_utm = Transformer.from_crs(WGS84_CRS, UTM_CRS, always_xy=True)
to_wgs84 = Transformer.from_crs(UTM_CRS, WGS84_CRS, always_xy=True)

GRID_SIZE_M = 2000.0  # 2 km grid


def get_canonical_bbox(lat: float, lon: float) -> Tuple[float, float, float, float]:
    """
    Given a WGS84 (lon, lat), transforms to UTM Zone 43N, snaps to the nearest
    2000m grid cell (canonical cell), and transforms the corners back to WGS84.
    
    Returns:
        Tuple of (min_lon, min_lat, max_lon, max_lat) in WGS84 EPSG:4326.
    """
    # 1. Transform input point to UTM
    utm_x, utm_y = to_utm.transform(lon, lat)
    
    # 2. Snap to canonical grid
    # Floor division to get the lower-left corner of the grid cell
    min_utm_x = (utm_x // GRID_SIZE_M) * GRID_SIZE_M
    min_utm_y = (utm_y // GRID_SIZE_M) * GRID_SIZE_M
    
    max_utm_x = min_utm_x + GRID_SIZE_M
    max_utm_y = min_utm_y + GRID_SIZE_M
    
    # 3. Transform corners back to WGS84
    min_lon_res, min_lat_res = to_wgs84.transform(min_utm_x, min_utm_y)
    max_lon_res, max_lat_res = to_wgs84.transform(max_utm_x, max_utm_y)
    
    return (min_lon_res, min_lat_res, max_lon_res, max_lat_res)


def generate_cache_key(
    lat: float, 
    lon: float, 
    unet_version: str = "v1", 
    sam_version: str = "v1", 
    preproc_version: str = "v1"
) -> str:
    """
    Generates a deterministic cache key based on the canonical UTM grid and versions.
    """
    utm_x, utm_y = to_utm.transform(lon, lat)
    min_utm_x = (utm_x // GRID_SIZE_M) * GRID_SIZE_M
    min_utm_y = (utm_y // GRID_SIZE_M) * GRID_SIZE_M
    
    return f"{int(min_utm_x)}_{int(min_utm_y)}_{int(min_utm_x+GRID_SIZE_M)}_{int(min_utm_y+GRID_SIZE_M)}_unet-{unet_version}_sam-{sam_version}_preproc-{preproc_version}"
