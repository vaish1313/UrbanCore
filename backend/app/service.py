"""Asynchronous satellite-analysis pipeline.

Earth Engine exports are intentionally submitted as background jobs: exports to
Google Drive can take minutes and must never hold an HTTP request open.
"""
from __future__ import annotations
import asyncio
import json
import os
import shutil
import time
from datetime import datetime
from pathlib import Path
from threading import Lock
from uuid import uuid4
import httpx
from fastapi import HTTPException
from .config import settings
from .schemas import AnalysisRequest
from .gee_service import gee_service
from .gcs_service import gcs_service
from .model_service import model_service
from .sam3d_service import sam3d_service
from .gee_cache_service import gee_tiff_cache
from .compliance_service import check_compliance
import pyproj
from shapely.geometry import shape, mapping
from shapely.ops import transform
from .municipal_service import persist_municipal_cases


def enrich_with_compliance(result: dict, year: int, analysis_id: str) -> None:
    """Enrich the inference result with compliance data for each detected construction polygon."""
    geojson_path = result.get("geojson_path")
    if not geojson_path or not os.path.exists(geojson_path):
        result["compliance"] = []
        return

    if result.get("construction_pixels", 0) == 0:
        result["compliance"] = []
        return

    metadata = result.get("metadata", {})
    src_crs_str = metadata.get("crs")
    
    if not src_crs_str:
        print(f"Warning: Missing CRS in metadata for year {year}. Skipping compliance check to avoid false results.")
        result["compliance"] = []
        return

    transformer = None
    is_wgs84 = False
    try:
        src_crs = pyproj.CRS.from_string(src_crs_str)
        dst_crs = pyproj.CRS.from_epsg(4326)
        if src_crs == dst_crs:
            is_wgs84 = True
        else:
            transformer = pyproj.Transformer.from_crs(src_crs, dst_crs, always_xy=True)
    except Exception as e:
        print(f"Warning: Failed to parse CRS '{src_crs_str}': {e}. Skipping compliance.")
        result["compliance"] = []
        return

    try:
        with open(geojson_path, 'r') as f:
            feature_collection = json.load(f)
    except Exception as e:
        print(f"Warning: Failed to read GeoJSON for compliance check: {e}")
        result["compliance"] = []
        return

    compliance_results = []
    
    for i, feature in enumerate(feature_collection.get("features", [])):
        geom = feature.get("geometry")
        if not geom:
            continue
            
        try:
            geom_shape = shape(geom)
            if geom_shape.is_empty:
                continue
                
            if not is_wgs84 and transformer:
                geom_shape = transform(transformer.transform, geom_shape)
                
            geom_reproj = mapping(geom_shape)
            
            comp_result = check_compliance(geom_reproj)
            
            if comp_result.get("potential_violation"):
                comp_result["year"] = year
                comp_result["polygon_index"] = i
                comp_result["geometry"] = geom_reproj
                compliance_results.append(comp_result)
                
        except Exception as e:
            print(f"Warning: Failed to process polygon {i} for compliance: {e}")
            continue

    result["compliance"] = compliance_results
    
    # Persist the cases to the municipal database
    try:
        persist_municipal_cases(analysis_id, year, compliance_results)
    except Exception as e:
        print(f"Warning: Failed to persist municipal cases for {analysis_id}: {e}")



class AnalysisStore:
    """In-memory storage for analysis state and results."""
    
    def __init__(self):
        self.data: dict[str, dict] = {}
        self.lock = Lock()

    def create(self, request: AnalysisRequest) -> dict:
        """Create a new analysis record."""
        years = list(range(request.end_year - 5, request.end_year + 1))
        record = {
            "id": str(uuid4()),
            "status": "queued",
            "latitude": request.latitude,
            "longitude": request.longitude,
            "radius_m": request.radius_m,
            "start_year": request.end_year - 5,
            "end_year": request.end_year,
            "years": years,
            "gee_tasks": [],
            "downloads": {},
            "inference_results": {},
            "visualization_results": {},
            "error": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        with self.lock:
            self.data[record["id"]] = record
        return record.copy()

    def get(self, analysis_id: str) -> dict | None:
        """Get analysis record by ID."""
        with self.lock:
            record = self.data.get(analysis_id)
            return record.copy() if record else None

    def update(self, analysis_id: str, **values) -> None:
        """Update analysis record fields."""
        with self.lock:
            if analysis_id in self.data:
                self.data[analysis_id].update(values)
                self.data[analysis_id]["updated_at"] = datetime.now().isoformat()


analyses = AnalysisStore()


async def geocode(query: str) -> list[dict]:
    """Search OpenStreetMap Nominatim without exposing a third-party browser key."""
    # Coordinate input is useful for direct GPS searches, e.g. "20.0059, 73.7912".
    try:
        lat, lon = (float(part.strip()) for part in query.split(",", 1))
        if -90 <= lat <= 90 and -180 <= lon <= 180:
            return [{"label": f"{lat:.6f}, {lon:.6f}", "latitude": lat, "longitude": lon}]
    except (ValueError, IndexError):
        pass
    async with httpx.AsyncClient(timeout=12, headers={"User-Agent": "UrbanCore/1.0 (location search)"}) as client:
        response = await client.get("https://nominatim.openstreetmap.org/search", params={"q": query, "format": "jsonv2", "limit": 6})
    if response.is_error:
        raise HTTPException(502, "Location search is temporarily unavailable")
    return [{"label": item["display_name"], "latitude": float(item["lat"]), "longitude": float(item["lon"])} for item in response.json()]


def run_analysis(analysis_id: str, request: AnalysisRequest) -> None:
    """
    Complete analysis pipeline running in background.
    
    Steps:
    0. Check TIFF cache for all requested years (NEW - cache-first orchestration)
    1. Export imagery from Google Earth Engine to Drive (only for missing years)
    2. Monitor export tasks until complete
    3. Download GeoTIFF files from Drive
    4. Run UNet inference for construction detection
    5. Run SAM-3D for detailed semantic segmentation
    6. Generate visualization GeoJSON for UI
    """
    try:
        # Get years from the analysis record
        analysis_record = analyses.get(analysis_id)
        requested_years = analysis_record["years"]
        
        # Step 0: Check TIFF cache BEFORE submitting GEE exports
        analyses.update(analysis_id, status="checking_cache")
        print(f"[{analysis_id}] Checking TIFF cache for years: {requested_years}...")
        
        cached_years = []
        missing_years = []
        cached_tiff_paths = {}  # year -> local path to cached TIFF
        
        for year in requested_years:
            # Generate cache key and check if TIFF is cached
            cache_key = gee_tiff_cache.generate_cache_key(
                latitude=request.latitude,
                longitude=request.longitude,
                radius_m=request.radius_m,
                year=year,
                gee_version=settings.gee_version
            )
            
            cached_data = gee_tiff_cache.get(cache_key)
            
            if cached_data and cached_data.get("tif_path"):
                cached_years.append(year)
                cached_tiff_paths[year] = cached_data["tif_path"]
                print(f"[{analysis_id}] Year {year}: CACHED (reusing)")
            else:
                missing_years.append(year)
                print(f"[{analysis_id}] Year {year}: CACHE MISS (will export from GEE)")
        
        print(f"[{analysis_id}] Cache summary: {len(cached_years)} cached, {len(missing_years)} missing")
        
        # Step 1: Submit Earth Engine export tasks ONLY for missing years
        analyses.update(analysis_id, status="exporting")
        print(f"[{analysis_id}] Starting Earth Engine exports for missing years...")
        
        exports = []
        if missing_years:
            # Calculate start_year/end_year for missing years range
            min_year = min(missing_years)
            max_year = max(missing_years)
            
            exports = gee_service.export_imagery_to_drive(
                latitude=request.latitude,
                longitude=request.longitude,
                radius_m=request.radius_m,
                start_year=min_year,
                end_year=max_year,
                analysis_id=analysis_id
            )
            
            print(f"[{analysis_id}] Submitted {len(exports)} export tasks to GEE for {len(missing_years)} missing years")
        else:
            print(f"[{analysis_id}] All years cached! No GEE exports needed.")
        
        analyses.update(
            analysis_id,
            status="exports_submitted",
            gee_tasks=exports
        )
        print(f"[{analysis_id}] Submitted {len(exports)} export tasks to GEE")
        
        # Step 2: Monitor export completion (only if there are missing years)
        # Submission only queues the exports; files are not ready in Drive until
        # every task completes.
        if missing_years:
            analyses.update(
                analysis_id,
                status="monitoring_exports",
                message="Waiting for Earth Engine exports to complete. This may take 5-15 minutes."
            )

            task_ids = [export["gee_task_id"] for export in exports]
            deadline = time.monotonic() + settings.gee_export_timeout_seconds
            terminal_failures = {"FAILED", "CANCELLED", "CANCELED", "NOT_FOUND"}

            while True:
                task_statuses = gee_service.check_all_tasks(task_ids)
                normalized_states = {
                    task_id: str(details.get("state", "UNKNOWN")).upper()
                    for task_id, details in task_statuses.items()
                }

                # Keep the frontend task details synchronized with Earth Engine.
                for export in exports:
                    details = task_statuses.get(export["gee_task_id"], {})
                    export["status"] = str(details.get("state", "UNKNOWN")).lower()
                    export["progress"] = details.get("progress", 0)
                analyses.update(analysis_id, gee_tasks=exports)

                failures = {
                    task_id: state
                    for task_id, state in normalized_states.items()
                    if state in terminal_failures
                }
                if failures:
                    raise RuntimeError(f"Earth Engine export task failure: {failures}")

                if normalized_states and all(state == "COMPLETED" for state in normalized_states.values()):
                    break

                if time.monotonic() >= deadline:
                    raise TimeoutError(
                        f"Earth Engine exports did not complete within "
                        f"{settings.gee_export_timeout_seconds // 60} minutes"
                    )

                time.sleep(settings.gee_poll_interval_seconds)

            analyses.update(
                analysis_id,
                status="exports_completed",
                message="GEE exports completed. Files available in Google Cloud Storage."
            )
        else:
            # All years are cached, skip GEE monitoring
            print(f"[{analysis_id}] Skipping GEE monitoring (all years cached)")
            analyses.update(
                analysis_id,
                status="exports_completed",
                message="All years found in cache. Skipping GEE exports."
            )
        
        # Step 3: Download from Google Cloud Storage (only for missing years)
        # and copy cached TIFFs to the download directory
        analyses.update(analysis_id, status="downloading")
        print(f"[{analysis_id}] Assembling TIFF files (cached + downloaded)...")
        
        # Setup directories
        data_dir = settings.analysis_dir / analysis_id
        download_dir = data_dir / "downloads"
        download_dir.mkdir(parents=True, exist_ok=True)
        
        # Dictionary to hold all TIFF paths: year -> path
        all_tiff_paths = {}
        
        # Copy cached TIFFs to download directory
        if cached_years:
            print(f"[{analysis_id}] Copying {len(cached_years)} cached TIFFs to download directory...")
            for year in cached_years:
                cached_path = Path(cached_tiff_paths[year])
                download_path = download_dir / f"urbancore_{analysis_id}_{year}.tif"
                
                # Copy the cached TIFF to the download directory
                shutil.copy2(cached_path, download_path)
                all_tiff_paths[year] = download_path
                print(f"[{analysis_id}] Year {year}: copied from cache")
        
        # Download missing TIFFs from GCS
        if missing_years:
            print(f"[{analysis_id}] Downloading {len(missing_years)} TIFFs from Google Cloud Storage...")
            
            downloaded_files = gcs_service.download_analysis_files(
                analysis_id=analysis_id,
                destination_dir=download_dir,
                years=missing_years,
                latitude=request.latitude,
                longitude=request.longitude,
                radius_m=request.radius_m
            )
            
            if not downloaded_files:
                raise RuntimeError("No files were downloaded from Google Cloud Storage")
            
            all_tiff_paths.update(downloaded_files)
        
        if not all_tiff_paths:
            raise RuntimeError("No TIFF files available (no cache, no downloads)")
        
        analyses.update(
            analysis_id,
            status="processing",
            downloads={year: str(path) for year, path in all_tiff_paths.items()}
        )
        
        # Step 4: Run UNet inference for each year
        print(f"[{analysis_id}] Running UNet inference...")
        inference_dir = data_dir / "inference"
        inference_results = {}
        
        for year, tif_path in all_tiff_paths.items():
            print(f"[{analysis_id}] Processing year {year}...")
            
            year_output_dir = inference_dir / str(year)
            
            # Pass geographic parameters for caching
            result = model_service.process_tif(
                tif_path=tif_path,
                output_dir=year_output_dir,
                latitude=request.latitude,
                longitude=request.longitude,
                radius_m=request.radius_m,
                year=year
            )
            enrich_with_compliance(result, year, analysis_id)
            inference_results[year] = result
        
        analyses.update(
            analysis_id,
            status="visualizing",
            inference_results=inference_results
        )
        
        # Step 5: Create detailed visualizations with SAM-3D
        viz_dir = data_dir / "visualization"
        if sam3d_service and sam3d_service.initialized:
            print(f"[{analysis_id}] Generating SAM-3D visualizations...")
            viz_results = {}
            
            for year, tif_path in all_tiff_paths.items():
                # Get construction mask and metadata from inference
                inf_result = inference_results[year]
                
                # Read the mask
                import rasterio
                with rasterio.open(inf_result["mask_path"]) as src:
                    construction_mask = src.read(1)
                
                # Generate visualization
                year_viz_dir = viz_dir / str(year)
                viz_result = sam3d_service.process_for_visualization(
                    tif_path=tif_path,
                    construction_mask=construction_mask,
                    metadata=inf_result["metadata"],
                    output_dir=year_viz_dir
                )
                viz_results[year] = viz_result
            
            analyses.update(
                analysis_id,
                visualization_results=viz_results
            )
        
        # Step 6: Mark as completed
        analyses.update(
            analysis_id,
            status="completed",
            message="Analysis completed successfully"
        )
        
        print(f"[{analysis_id}] Analysis completed!")
        
    except Exception as exc:
        print(f"[{analysis_id}] Error: {exc}")
        analyses.update(analysis_id, status="failed", error=str(exc))


def process_downloaded_images(analysis_id: str) -> None:
    """
    Process downloaded GeoTIFF files with UNet and SAM-3D.
    
    This should be called after confirming GEE exports are complete
    and files are available in Google Drive.
    """
    try:
        analysis = analyses.get(analysis_id)
        if not analysis:
            raise ValueError(f"Analysis not found: {analysis_id}")
        
        analyses.update(analysis_id, status="downloading")
        
        # Setup directories
        data_dir = settings.analysis_dir / analysis_id
        download_dir = data_dir / "downloads"
        inference_dir = data_dir / "inference"
        viz_dir = data_dir / "visualization"
        
        # Step 3: Download from Google Drive
        print(f"[{analysis_id}] Downloading files from Google Drive...")
        downloaded_files = drive_service.download_analysis_files(
            analysis_id=analysis_id,
            destination_dir=download_dir,
            years=analysis["years"]
        )
        
        if not downloaded_files:
            raise RuntimeError("No files were downloaded from Google Drive")
        
        analyses.update(
            analysis_id,
            status="processing",
            downloads={year: str(path) for year, path in downloaded_files.items()}
        )
        
        # Step 4: Run UNet inference for each year
        print(f"[{analysis_id}] Running UNet inference...")
        inference_results = {}
        
        for year, tif_path in downloaded_files.items():
            print(f"[{analysis_id}] Processing year {year}...")
            
            year_output_dir = inference_dir / str(year)
            
            # Get original analysis parameters for caching
            analysis_record = analyses.get(analysis_id)
            result = model_service.process_tif(
                tif_path=tif_path,
                output_dir=year_output_dir,
                latitude=analysis_record["latitude"],
                longitude=analysis_record["longitude"],
                radius_m=analysis_record["radius_m"],
                year=year
            )
            enrich_with_compliance(result, year, analysis_id)
            inference_results[year] = result
        
        analyses.update(
            analysis_id,
            status="visualizing",
            inference_results=inference_results
        )
        
        # Step 5: Create detailed visualizations with SAM-3D
        if sam3d_service and sam3d_service.initialized:
            print(f"[{analysis_id}] Generating SAM-3D visualizations...")
            viz_results = {}
            
            for year, tif_path in downloaded_files.items():
                # Get construction mask and metadata from inference
                inf_result = inference_results[year]
                
                # Read the mask
                import rasterio
                with rasterio.open(inf_result["mask_path"]) as src:
                    construction_mask = src.read(1)
                
                # Generate visualization
                year_viz_dir = viz_dir / str(year)
                viz_result = sam3d_service.process_for_visualization(
                    tif_path=tif_path,
                    construction_mask=construction_mask,
                    metadata=inf_result["metadata"],
                    output_dir=year_viz_dir
                )
                viz_results[year] = viz_result
            
            analyses.update(
                analysis_id,
                visualization_results=viz_results
            )
        
        # Step 6: Mark as completed
        analyses.update(
            analysis_id,
            status="completed",
            message="Analysis completed successfully"
        )
        
        print(f"[{analysis_id}] Analysis completed!")
        
    except Exception as exc:
        print(f"[{analysis_id}] Processing error: {exc}")
        analyses.update(analysis_id, status="failed", error=str(exc))
