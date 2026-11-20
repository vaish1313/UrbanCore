"""GEE/TIFF caching service for UrbanCore to avoid redundant exports and downloads."""
import json
import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import rasterio
from .config import settings


class GeeTiffCacheService:
    """File-based caching for GEE-exported GeoTIFFs to avoid redundant exports and downloads."""
    
    def __init__(self):
        self.cache_dir = settings.analysis_dir.parent / "cache" / "gee"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_cache_key(
        self,
        latitude: float,
        longitude: float, 
        radius_m: int,
        year: int,
        gee_version: str
    ) -> str:
        """
        Generate deterministic cache key from geographic and GEE parameters.
        
        Args:
            latitude: Center point latitude
            longitude: Center point longitude
            radius_m: Buffer radius in meters
            year: Analysis year
            gee_version: GEE/preprocessing version (e.g., "v1")
            
        Returns:
            Unique cache key string
        """
        # Normalize coordinates to 6 decimal places (≈1 meter precision)
        normalized_params = {
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "radius_m": radius_m,
            "year": year,
            "gee_version": gee_version
        }
        
        # Create deterministic JSON representation
        json_str = json.dumps(normalized_params, sort_keys=True, separators=(',', ':'))
        
        # Generate SHA-256 hash
        hash_obj = hashlib.sha256(json_str.encode('utf-8'))
        hash_hex = hash_obj.hexdigest()  # Full SHA-256 digest
        
        # Create human-readable cache key
        cache_key = f"gee_{hash_hex}_y{year}_gv{gee_version}"
        
        return cache_key
    
    def _get_cache_paths(self, cache_key: str) -> Dict[str, Path]:
        """Get the file paths for a cache key."""
        return {
            'tif': self.cache_dir / f"{cache_key}.tif",
            'metadata': self.cache_dir / f"{cache_key}.json"
        }
    
    def exists(self, cache_key: str) -> bool:
        """Check if cache entry exists (both TIFF and metadata)."""
        paths = self._get_cache_paths(cache_key)
        return paths['tif'].exists() and paths['metadata'].exists()
    
    def validate(self, cache_key: str) -> bool:
        """
        Validate cached TIFF entry.
        
        Args:
            cache_key: The cache key
            
        Returns:
            True if cache entry is valid, False otherwise
        """
        if not self.exists(cache_key):
            return False
            
        paths = self._get_cache_paths(cache_key)
        
        try:
            # Validate metadata JSON
            with open(paths['metadata'], 'r') as f:
                metadata = json.load(f)
                
            # Check required metadata fields
            required_fields = ['cache_key', 'latitude', 'longitude', 'radius_m', 'year', 'gee_version', 'tif_path']
            if not all(field in metadata for field in required_fields):
                print(f"    Warning: Invalid cache metadata missing fields: {paths['metadata']}")
                return False
                
            # Validate TIFF file
            tif_path = Path(metadata['tif_path'])
            if not tif_path.exists():
                print(f"    Warning: Cached TIFF file missing: {tif_path}")
                return False
                
            # Validate TIFF is readable and has expected structure
            with rasterio.open(tif_path) as src:
                # Check band count (should be 10: B2, B3, B4, B8, B11, B12, NDVI, NDBI, NDWI, BSI)
                if src.count != 10:
                    print(f"    Warning: Cached TIFF has {src.count} bands, expected 10: {tif_path}")
                    return False
                    
                # Check dimensions are valid
                if src.width <= 0 or src.height <= 0:
                    print(f"    Warning: Cached TIFF has invalid dimensions {src.width}x{src.height}: {tif_path}")
                    return False
                    
                # Try to read a small sample to ensure it's not corrupt
                try:
                    sample = src.read(1, window=((0, min(10, src.height)), (0, min(10, src.width))))
                    if sample.size == 0:
                        print(f"    Warning: Cached TIFF appears to be empty: {tif_path}")
                        return False
                except Exception as e:
                    print(f"    Warning: Cached TIFF is not readable: {tif_path}, error: {e}")
                    return False
                    
            return True
            
        except (json.JSONDecodeError, KeyError, Exception) as e:
            print(f"    Warning: Cache validation failed for {cache_key}: {e}")
            return False
    
    def get(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached TIFF metadata and path if valid.
        
        Args:
            cache_key: The cache key
            
        Returns:
            Cached metadata dictionary if valid, None if missing or invalid
        """
        if not self.validate(cache_key):
            return None
            
        paths = self._get_cache_paths(cache_key)
        
        try:
            with open(paths['metadata'], 'r') as f:
                cached_data = json.load(f)
            return cached_data
            
        except (json.JSONDecodeError, Exception) as e:
            print(f"    Warning: Failed to read cache metadata {paths['metadata']}: {e}")
            return None
    
    def set(
        self,
        cache_key: str,
        latitude: float,
        longitude: float,
        radius_m: int, 
        year: int,
        gee_version: str,
        source_tif_path: Path
    ) -> Optional[Path]:
        """
        Store TIFF in cache.
        
        Args:
            cache_key: The cache key
            latitude: Original latitude
            longitude: Original longitude  
            radius_m: Original radius
            year: Analysis year
            gee_version: GEE version
            source_tif_path: Path to the source TIFF to cache
            
        Returns:
            Path to cached TIFF if successful, None if failed
        """
        if not source_tif_path.exists():
            print(f"    Warning: Source TIFF does not exist: {source_tif_path}")
            return None
            
        paths = self._get_cache_paths(cache_key)
        
        try:
            # Copy TIFF to cache directory
            shutil.copy2(source_tif_path, paths['tif'])
            
            # Get file size for metadata
            file_size = paths['tif'].stat().st_size
            
            # Create metadata
            metadata = {
                "cache_key": cache_key,
                "latitude": latitude,
                "longitude": longitude, 
                "radius_m": radius_m,
                "year": year,
                "gee_version": gee_version,
                "tif_path": str(paths['tif']),
                "created_at": datetime.now().isoformat(),
                "file_size": file_size,
                "source_path": str(source_tif_path)
            }
            
            # Save metadata
            with open(paths['metadata'], 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
                
            print(f"    TIFF CACHE STORED: {cache_key}")
            print(f"    Cached TIFF: {paths['tif']} ({file_size:,} bytes)")
            
            return paths['tif']
            
        except Exception as e:
            print(f"    Warning: Failed to cache TIFF {source_tif_path}: {e}")
            # Clean up partial cache entry
            if paths['tif'].exists():
                paths['tif'].unlink()
            if paths['metadata'].exists():
                paths['metadata'].unlink()
            return None
    
    def copy_to_analysis_dir(
        self, 
        cache_key: str, 
        destination_path: Path
    ) -> Optional[Path]:
        """
        Copy cached TIFF to analysis directory for downstream processing.
        
        Args:
            cache_key: The cache key
            destination_path: Where to copy the cached TIFF
            
        Returns:
            Path to copied file if successful, None if failed
        """
        cached_data = self.get(cache_key)
        if cached_data is None:
            return None
            
        cached_tif_path = Path(cached_data['tif_path'])
        if not cached_tif_path.exists():
            return None
            
        try:
            # Ensure destination directory exists
            destination_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy cached TIFF to analysis directory
            shutil.copy2(cached_tif_path, destination_path)
            
            print(f"    Copied cached TIFF: {cached_tif_path} → {destination_path}")
            return destination_path
            
        except Exception as e:
            print(f"    Warning: Failed to copy cached TIFF: {e}")
            return None


# Singleton instance
gee_tiff_cache = GeeTiffCacheService()