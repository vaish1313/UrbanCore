"""Google Cloud Storage service for downloading exported imagery."""
from pathlib import Path
from google.cloud import storage
from google.oauth2 import service_account
from .config import settings


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
            raise RuntimeError("Google service account credentials not configured")

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
        years: list[int]
    ) -> dict[int, Path]:
        """
        Download all GeoTIFF files for a specific analysis from GCS.
        
        Args:
            analysis_id: The analysis identifier
            destination_dir: Directory to save downloaded files
            years: List of years to download
            
        Returns:
            Dictionary mapping year to downloaded file path
        """
        self._initialize()

        # Ensure destination directory exists
        destination_dir.mkdir(parents=True, exist_ok=True)

        downloaded = {}

        for year in years:
            filename = f"urbancore_{analysis_id}_{year}.tif"
            gcs_path = f"analyses/{analysis_id}/{filename}"
            destination = destination_dir / filename

            try:
                # Check if file exists first
                if not self.check_file_exists(gcs_path):
                    print(f"Warning: File not found in GCS: {gcs_path}")
                    continue

                # Download the file
                self.download_file(gcs_path, destination)
                downloaded[year] = destination
                print(f"Downloaded from GCS: {filename}")
            except Exception as e:
                print(f"Error downloading {filename} from GCS: {e}")

        return downloaded


# Singleton instance
gcs_service = GoogleCloudStorageService()
