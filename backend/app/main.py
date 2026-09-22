from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .auth import login, register
from .config import settings
from .schemas import AnalysisRequest, GeocodeResult, LoginRequest, RegisterRequest
from .service import analyses, geocode, run_analysis, process_downloaded_images

app = FastAPI(title="UrbanCore API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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
