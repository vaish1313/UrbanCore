"""
Google Drive API manager for interacting with the shared UrbanCore_Data folder.
"""
import os
import io
import time
from typing import Optional
from loguru import logger
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError

from app.core.config import settings

# Google Drive API scopes
SCOPES = ['https://www.googleapis.com/auth/drive']


class DriveManager:
    """Manages files in Google Drive via Service Account."""
    
    def __init__(self):
        """Initialize Google Drive API client using service account credentials."""
        self.folder_id = settings.GOOGLE_DRIVE_FOLDER_ID
        
        if not self.folder_id:
            logger.warning("GOOGLE_DRIVE_FOLDER_ID is not configured.")
            
        if not settings.GEE_PRIVATE_KEY_PATH or not os.path.exists(settings.GEE_PRIVATE_KEY_PATH):
            logger.warning(f"Google credentials not found at {settings.GEE_PRIVATE_KEY_PATH}. DriveManager will fail.")
            self.service = None
            return
            
        try:
            creds = service_account.Credentials.from_service_account_file(
                settings.GEE_PRIVATE_KEY_PATH, scopes=SCOPES
            )
            self.service = build('drive', 'v3', credentials=creds)
            logger.info("Google Drive API client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Google Drive client: {e}")
            self.service = None

    def find_file_by_name(self, file_name: str) -> Optional[dict]:
        """Find a file by exact name in the designated Drive folder."""
        if not self.service or not self.folder_id:
            return None
            
        try:
            # Query: Name equals exactly, and it is a child of the designated folder
            query = f"name = '{file_name}' and '{self.folder_id}' in parents and trashed = false"
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name, size)'
            ).execute()
            
            items = results.get('files', [])
            if not items:
                return None
                
            return items[0]  # Return the first match
        except HttpError as e:
            logger.error(f"Google Drive API error finding file {file_name}: {e}")
            return None

    def wait_for_file(self, file_name: str, timeout_seconds: int = 3600, poll_interval: int = 15) -> Optional[dict]:
        """Poll the Drive folder until the file appears (i.e. GEE export finished)."""
        start_time = time.time()
        logger.info(f"Waiting up to {timeout_seconds}s for {file_name} to appear in Drive...")
        
        while time.time() - start_time < timeout_seconds:
            file_meta = self.find_file_by_name(file_name)
            if file_meta:
                logger.info(f"File {file_name} found! (ID: {file_meta['id']}, Size: {file_meta.get('size', 'unknown')} bytes)")
                return file_meta
                
            time.sleep(poll_interval)
            
        logger.error(f"Timeout waiting for {file_name} in Google Drive after {timeout_seconds}s")
        return None

    def download_file(self, file_id: str, output_path: str) -> bool:
        """Download a file from Drive by ID to the local path."""
        if not self.service:
            return False
            
        try:
            request = self.service.files().get_media(fileId=file_id)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with io.FileIO(output_path, 'wb') as fh:
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                    if status:
                        logger.debug(f"Download {int(status.progress() * 100)}%.")
                        
            logger.info(f"Successfully downloaded file to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to download file ID {file_id}: {e}")
            # Ensure partially downloaded file is removed
            if os.path.exists(output_path):
                try:
                    os.remove(output_path)
                except:
                    pass
            return False

    def delete_file(self, file_id: str) -> bool:
        """Delete a file from Drive permanently to save quota."""
        if not self.service:
            return False
            
        try:
            self.service.files().delete(fileId=file_id).execute()
            logger.info(f"Successfully deleted file ID {file_id} from Google Drive")
            return True
        except HttpError as e:
            logger.error(f"Failed to delete file ID {file_id}: {e}")
            return False
