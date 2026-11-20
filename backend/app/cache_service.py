"""Inference result caching service for UrbanCore V1 model."""
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from .config import settings


class InferenceCacheService:
    """File-based caching for inference results to avoid redundant model execution."""
    
    def __init__(self):
        self.cache_dir = settings.analysis_dir.parent / "cache" / "inference"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_cache_key(
        self,
        latitude: float,
        longitude: float, 
        radius_m: int,
        year: int,
        model_version: str,
        preprocessing_version: str
    ) -> str:
        """
        Generate deterministic cache key from geographic and processing parameters.
        
        Args:
            latitude: Center point latitude
            longitude: Center point longitude
            radius_m: Buffer radius in meters
            year: Analysis year
            model_version: Model version (e.g., "v1")
            preprocessing_version: Preprocessing version (e.g., "v1")
            
        Returns:
            Unique cache key string
        """
        # Normalize coordinates to 6 decimal places (≈1 meter precision)
        normalized_params = {
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "radius_m": radius_m,
            "year": year,
            "model_version": model_version,
            "preprocessing_version": preprocessing_version
        }
        
        # Create deterministic JSON representation
        json_str = json.dumps(normalized_params, sort_keys=True, separators=(',', ':'))
        
        # Generate SHA-256 hash
        hash_obj = hashlib.sha256(json_str.encode('utf-8'))
        hash_hex = hash_obj.hexdigest()  # Full SHA-256 digest
        
        # Create human-readable cache key
        cache_key = f"inference_{hash_hex}_y{year}_m{model_version}_p{preprocessing_version}"
        
        return cache_key
    
    def _get_cache_file_path(self, cache_key: str) -> Path:
        """Get the file path for a cache key."""
        return self.cache_dir / f"{cache_key}.json"
    
    def exists(self, cache_key: str) -> bool:
        """Check if cache entry exists."""
        cache_file = self._get_cache_file_path(cache_key)
        return cache_file.exists()
    
    def get(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached inference result.
        
        Args:
            cache_key: The cache key
            
        Returns:
            Cached result dictionary if valid, None if missing or invalid
        """
        cache_file = self._get_cache_file_path(cache_key)
        
        if not cache_file.exists():
            return None
            
        try:
            with open(cache_file, 'r') as f:
                cached_data = json.load(f)
                
            # Verify that referenced output files still exist
            mask_path = cached_data.get('mask_path')
            geojson_path = cached_data.get('geojson_path')
            
            if mask_path and not Path(mask_path).exists():
                print(f"    Warning: Cached mask file missing: {mask_path}")
                return None
                
            if geojson_path and not Path(geojson_path).exists():
                print(f"    Warning: Cached GeoJSON file missing: {geojson_path}")
                return None
                
            return cached_data
            
        except (json.JSONDecodeError, KeyError, Exception) as e:
            print(f"    Warning: Invalid cache file {cache_file}: {e}")
            return None
    
    def set(
        self,
        cache_key: str,
        latitude: float,
        longitude: float,
        radius_m: int, 
        year: int,
        model_version: str,
        preprocessing_version: str,
        inference_result: Dict[str, Any]
    ) -> None:
        """
        Store inference result in cache.
        
        Args:
            cache_key: The cache key
            latitude: Original latitude
            longitude: Original longitude  
            radius_m: Original radius
            year: Analysis year
            model_version: Model version
            preprocessing_version: Preprocessing version
            inference_result: Result from model_service.process_tif()
        """
        cache_data = {
            "cache_key": cache_key,
            "latitude": latitude,
            "longitude": longitude, 
            "radius_m": radius_m,
            "year": year,
            "model_version": model_version,
            "preprocessing_version": preprocessing_version,
            "mask_path": inference_result.get("mask_path"),
            "geojson_path": inference_result.get("geojson_path"),
            "total_pixels": inference_result.get("total_pixels"),
            "construction_pixels": inference_result.get("construction_pixels"), 
            "construction_percentage": inference_result.get("construction_percentage"),
            "metadata": inference_result.get("metadata"),
            "created_at": datetime.now().isoformat()
        }
        
        cache_file = self._get_cache_file_path(cache_key)
        
        try:
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f, indent=2, default=str)
                
            print(f"    CACHE STORED: {cache_key}")
            
        except Exception as e:
            print(f"    Warning: Failed to save cache file {cache_file}: {e}")


# Singleton instance
inference_cache = InferenceCacheService()