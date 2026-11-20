from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
from pathlib import Path
from .auth import login, register
from .config import settings
from .schemas import AnalysisRequest, GeocodeResult, LoginRequest, RegisterRequest
from .service import analyses, geocode, resolve_data_path, run_analysis, process_downloaded_images
from .compliance_router import router as compliance_router
from .municipal_router import router as municipal_router
from .complaints_router import router as complaints_router, municipal_router as municipal_complaints_router
from .builder_router import router as builder_router

app = FastAPI(title="UrbanCore API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(compliance_router, prefix=settings.api_v1_prefix)
app.include_router(municipal_router, prefix=f"{settings.api_v1_prefix}/municipal")
app.include_router(complaints_router, prefix=f"{settings.api_v1_prefix}/complaints")
app.include_router(municipal_complaints_router, prefix=f"{settings.api_v1_prefix}/municipal/complaints")
# Builder Dashboard APIs: /api/v1/builder/aois and /api/v1/aois/compare
app.include_router(builder_router, prefix=f"{settings.api_v1_prefix}/builder")
app.include_router(builder_router, prefix=settings.api_v1_prefix)

@app.get("/health")
async def health(): 
    return {"status": "ok", "message": "UrbanCore API is running"}

@app.post(f"{settings.api_v1_prefix}/auth/register")
async def auth_register(request: RegisterRequest): 
    return await register(request)

@app.post(f"{settings.api_v1_prefix}/auth/login")
async def auth_login(request: LoginRequest): 
    return await login(request)

@app.get(f"{settings.api_v1_prefix}/locations/search", response_model=list[GeocodeResult])
async def location_search(q: str = Query(min_length=2, max_length=180)):
    return await geocode(q)

@app.post(f"{settings.api_v1_prefix}/analyses")
async def create_analysis(request: AnalysisRequest, tasks: BackgroundTasks):
    """
    Create a new construction analysis for the specified coordinates.
    
    This submits Earth Engine export tasks for satellite imagery from the last 5 years.
    The analysis runs asynchronously - use GET /analyses/{id} to check status.
    """
    analysis = analyses.create(request)
    tasks.add_task(run_analysis, analysis["id"], request)
    return analysis

@app.get(f"{settings.api_v1_prefix}/analyses/{{analysis_id}}")
async def get_analysis(analysis_id: str):
    """
    Get the current status and results of an analysis.
    
    Status values:
    - queued: Analysis created, not yet started
    - exporting: Submitting Earth Engine export tasks
    - exports_submitted: Export tasks submitted to GEE
    - monitoring_exports: Waiting for exports to complete
    - exports_completed: Ready for download
    - downloading: Downloading files from Google Drive
    - processing: Running UNet inference
    - visualizing: Creating SAM-3D visualizations
    - completed: Analysis finished successfully
    - failed: An error occurred
    """
    result = analyses.get(analysis_id)
    if not result: 
        raise HTTPException(404, "Analysis not found")
    return result

@app.post(f"{settings.api_v1_prefix}/analyses/{{analysis_id}}/process")
async def trigger_processing(analysis_id: str, tasks: BackgroundTasks):
    """
    Manually trigger processing of downloaded imagery.
    
    Call this after confirming GEE exports are complete and files are in Google Drive.
    This downloads the files, runs UNet inference, and generates visualizations.
    """
    analysis = analyses.get(analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    
    if analysis["status"] not in ["exports_completed", "failed"]:
        raise HTTPException(
            400,
            f"Cannot process analysis with status: {analysis['status']}. "
            "Wait for exports to complete first."
        )
    
    tasks.add_task(process_downloaded_images, analysis_id)
    analyses.update(analysis_id, status="queued_for_processing")
    
    return {
        "message": "Processing started",
        "analysis_id": analysis_id,
        "status": "queued_for_processing"
    }

@app.get(f"{settings.api_v1_prefix}/analyses/{{analysis_id}}/results/{{year}}")
async def get_year_results(analysis_id: str, year: int):
    """
    Get detailed results for a specific year.
    
    Returns inference statistics and URLs to GeoJSON visualization files.
    """
    analysis = analyses.get(analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    
    if analysis["status"] != "completed":
        raise HTTPException(400, "Analysis not yet completed")
    
    inference = analysis.get("inference_results", {}).get(str(year))
    visualization = analysis.get("visualization_results", {}).get(str(year))
    
    if not inference:
        raise HTTPException(404, f"No results found for year {year}")
    
    return {
        "year": year,
        "analysis_id": analysis_id,
        "inference": inference,
        "visualization": visualization
    }

@app.get(f"{settings.api_v1_prefix}/analyses/{{analysis_id}}/geojson/{{year}}/{{file_type}}")
async def get_geojson_file(analysis_id: str, year: int, file_type: str):
    """
    Get the actual GeoJSON file for a specific analysis year.
    
    Args:
        analysis_id: UUID of the analysis
        year: Year to retrieve (must be in analysis year range)
        file_type: Either 'inference' or 'visualization'
    
    Returns:
        GeoJSON content as application/json
    """
    # Validate file_type
    if file_type not in ["inference", "visualization"]:
        raise HTTPException(400, "file_type must be 'inference' or 'visualization'")
    
    # Get and validate analysis
    analysis = analyses.get(analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    
    if analysis["status"] != "completed":
        raise HTTPException(400, "Analysis not yet completed")
    
    # Get the appropriate results for the year
    if file_type == "inference":
        results = analysis.get("inference_results", {}).get(str(year))
        if not results or "geojson_path" not in results:
            raise HTTPException(404, f"No inference GeoJSON found for year {year}")
        geojson_path = results["geojson_path"]
    else:  # visualization
        results = analysis.get("visualization_results", {}).get(str(year))
        if not results or "geojson_path" not in results:
            raise HTTPException(404, f"No visualization GeoJSON found for year {year}")
        geojson_path = results["geojson_path"]
    
    # Validate that the path contains the analysis_id (security check)
    # Note: Due to caching, the path might reference a different analysis_id
    # We validate that the path at least exists within the analyses directory structure
    if "analyses" not in geojson_path:
        raise HTTPException(403, "Invalid file path - must be within analyses directory")
    
    # Convert to absolute path and validate existence
    file_path = Path(geojson_path)
    if not file_path.is_absolute():
        # Relative path - resolve from current working directory
        file_path = Path.cwd() / file_path
    
    if not file_path.exists():
        raise HTTPException(404, "GeoJSON file not found on disk")
    
    if not file_path.suffix.lower() == ".geojson":
        raise HTTPException(400, "File is not a GeoJSON file")
    
    try:
        # Read and validate GeoJSON content
        with open(file_path, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        # Basic validation that it's valid GeoJSON
        if not isinstance(geojson_data, dict) or geojson_data.get("type") != "FeatureCollection":
            raise HTTPException(500, "Invalid GeoJSON format")
        
        # Return as proper JSON response with GeoJSON content type
        return JSONResponse(
            content=geojson_data,
            headers={"Content-Type": "application/geo+json"}
        )
    
    except json.JSONDecodeError:
        raise HTTPException(500, "Failed to parse GeoJSON file")
    except Exception as e:
        raise HTTPException(500, f"Failed to read GeoJSON file: {str(e)}")
