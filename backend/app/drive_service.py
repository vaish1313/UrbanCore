"""Google Drive service for downloading exported imagery."""
import io
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from .config import settings


class GoogleDriveService:
    """Handles Google Drive operations for downloading GEE exports."""

    def __init__(self):
        self.service = None
        self._initialize()

    def _initialize(self):
        """Initialize Google Drive API with service account credentials."""
        if self.service:
            return

        if not settings.gee_private_key_path:
            raise RuntimeError("Google service account credentials not configured")

        key_path = Path(settings.gee_private_key_path)
        if not key_path.exists():
            raise RuntimeError(f"Service account key not found at: {settings.gee_private_key_path}")

        credentials = service_account.Credentials.from_service_account_file(
            str(key_path),
            scopes=["https://www.googleapis.com/auth/drive.readonly"]
        )

        self.service = build("drive", "v3", credentials=credentials)

    def find_files_in_folder(self, folder_id: str, filename_prefix: str = None) -> list[dict]:
        """
        Find files in a specific Google Drive folder.
        
        Args:
            folder_id: Google Drive folder ID
            filename_prefix: Optional prefix to filter files
            
        Returns:
            List of file metadata dictionaries
        """
        self._initialize()

        query = f"'{folder_id}' in parents and trashed=false"
        if filename_prefix:
            query += f" and name contains '{filename_prefix}'"

        results = self.service.files().list(
            q=query,
            fields="files(id, name, mimeType, size, createdTime, modifiedTime)",
            pageSize=100
        ).execute()

        return results.get("files", [])

    def download_file(self, file_id: str, destination_path: Path) -> Path:
        """
        Download a file from Google Drive.
        
        Args:
            file_id: Google Drive file ID
            destination_path: Local path to save the file
            
        Returns:
            Path to the downloaded file
        """
        self._initialize()

        # Create parent directories if needed
        destination_path.parent.mkdir(parents=True, exist_ok=True)

        request = self.service.files().get_media(fileId=file_id)

        with open(destination_path, "wb") as fh:
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()

        return destination_path

    def download_analysis_files(
        self,
        analysis_id: str,
        destination_dir: Path,
        years: list[int]
    ) -> dict[int, Path]:
        """
        Download all GeoTIFF files for a specific analysis.
        
        Args:
            analysis_id: The analysis identifier
            destination_dir: Directory to save downloaded files
            years: List of years to download
            
        Returns:
            Dictionary mapping year to downloaded file path
        """
        self._initialize()

        folder_id = settings.google_drive_folder_id
        if not folder_id:
            raise RuntimeError("Google Drive folder ID not configured")

        # Ensure destination directory exists
        destination_dir.mkdir(parents=True, exist_ok=True)

        downloaded = {}

        for year in years:
            filename = f"urbancore_{analysis_id}_{year}.tif"

            # Search for the file
            files = self.find_files_in_folder(folder_id, filename)

            if not files:
                print(f"Warning: File not found in Drive: {filename}")
                continue

            # Download the first matching file
            file_info = files[0]
            destination = destination_dir / filename

            try:
                self.download_file(file_info["id"], destination)
                downloaded[year] = destination
                print(f"Downloaded: {filename}")
            except Exception as e:
                print(f"Error downloading {filename}: {e}")

        return downloaded


# Singleton instance
drive_service = GoogleDriveService()
