"""Google Cloud Storage service for downloading exported imagery."""
from pathlib import Path
from google.cloud import storage
from google.oauth2 import service_account
from .config import settings
from .gee_cache_service import gee_tiff_cache


class GoogleCloudStorageService:
    """Handles Google Cloud Storage operations for downloading GEE exports."""

    def __init__(self):
        self.client = None
        self.bucket = None
        self._initialize()

    def _initialize(self):
        """Initialize Google Cloud Storage client with service account credentials."""
        if self.client:
            return

        if not settings.gee_private_key_path:
            # Credentials not configured; skip GCS initialization for tests
            print("GCS credentials not configured; GCS client disabled.")
            self.client = None
            self.bucket = None
            return

        key_path = Path(settings.gee_private_key_path)
        if not key_path.exists():
            raise RuntimeError(f"Service account key not found at: {settings.gee_private_key_path}")

        # Create credentials from service account file
        credentials = service_account.Credentials.from_service_account_file(
            str(key_path),
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        # Initialize Storage client
        self.client = storage.Client(
            credentials=credentials,
            project=settings.gcs_project_id
        )
        
        # Get bucket
        self.bucket = self.client.bucket(settings.gcs_bucket_name)
        
        print(f"GCS initialized: bucket={settings.gcs_bucket_name}")

    def download_file(self, gcs_path: str, destination_path: Path) -> Path:
        """
        Download a file from Google Cloud Storage.
        
        Args:
            gcs_path: Path within the GCS bucket (e.g., "analyses/abc123/file.tif")
            destination_path: Local path to save the file
            
        Returns:
            Path to the downloaded file
        """
        self._initialize()

        # Create parent directories if needed
        destination_path.parent.mkdir(parents=True, exist_ok=True)

        # Get blob and download
        blob = self.bucket.blob(gcs_path)
        blob.download_to_filename(str(destination_path))

        return destination_path

    def check_file_exists(self, gcs_path: str) -> bool:
        """
        Check if a file exists in GCS.
        
        Args:
            gcs_path: Path within the GCS bucket
            
        Returns:
            True if file exists, False otherwise
        """
        self._initialize()
        
        blob = self.bucket.blob(gcs_path)
        return blob.exists()

    def download_analysis_files(
        self,
        analysis_id: str,
        destination_dir: Path,
        years: list[int],
        latitude: float = None,
        longitude: float = None,
        radius_m: int = None
    ) -> dict[int, Path]:
        """
        Download all GeoTIFF files for a specific analysis from GCS.
        
        Args:
            analysis_id: The analysis identifier
            destination_dir: Directory to save downloaded files
            years: List of years to download
            latitude: Center latitude for caching (optional)
            longitude: Center longitude for caching (optional)  
            radius_m: Buffer radius for caching (optional)
            
        Returns:
            Dictionary mapping year to downloaded file path
        """
        self._initialize()

        # Ensure destination directory exists
        destination_dir.mkdir(parents=True, exist_ok=True)

        downloaded = {}
        use_tiff_cache = all(param is not None for param in [latitude, longitude, radius_m])

        for year in years:
            filename = f"urbancore_{analysis_id}_{year}.tif"
            destination = destination_dir / filename
            cache_key = None
            
            # Check TIFF cache if geographic parameters provided
            if use_tiff_cache:
                cache_key = gee_tiff_cache.generate_cache_key(
                    latitude=latitude,
                    longitude=longitude,
                    radius_m=radius_m,
                    year=year,
                    gee_version=settings.gee_version
                )
                
                # Try to use cached TIFF
                if gee_tiff_cache.validate(cache_key):
                    print(f"    TIFF CACHE HIT: {cache_key}")
                    
                    # Copy cached TIFF to analysis directory
                    cached_path = gee_tiff_cache.copy_to_analysis_dir(cache_key, destination)
                    if cached_path:
                        downloaded[year] = cached_path
                        continue
                    else:
                        print(f"    Warning: Failed to copy cached TIFF, falling back to download")
                else:
                    print(f"    TIFF CACHE MISS: {cache_key}")
            else:
                print(f"    TIFF cache disabled: missing geographic parameters for {filename}")

            # Download from GCS (cache miss or cache disabled)
            gcs_path = f"analyses/{analysis_id}/{filename}"

            try:
                # Check if file exists first
                if not self.check_file_exists(gcs_path):
                    print(f"Warning: File not found in GCS: {gcs_path}")
                    continue

                # Download the file
                self.download_file(gcs_path, destination)
                downloaded[year] = destination
                print(f"Downloaded from GCS: {filename}")
                
                # Store in TIFF cache for future reuse
                if use_tiff_cache and cache_key:
                    try:
                        cached_path = gee_tiff_cache.set(
                            cache_key=cache_key,
                            latitude=latitude,
                            longitude=longitude,
                            radius_m=radius_m,
                            year=year,
                            gee_version=settings.gee_version,
                            source_tif_path=destination
                        )
                        if cached_path:
                            print(f"    TIFF CACHE STORED: {cache_key}")
                        else:
                            print(f"    TIFF CACHE STORE FAILED: {cache_key} - set() returned None")
                    except Exception as cache_err:
                        print(f"    TIFF CACHE STORE FAILED: {cache_key} - {cache_err}")
                
            except Exception as e:
                print(f"Error downloading {filename} from GCS: {e}")

        return downloaded


# Singleton instance
gcs_service = GoogleCloudStorageService()
