"""Script to create and configure Google Cloud Storage bucket."""
from google.cloud import storage
from google.oauth2 import service_account
from pathlib import Path

# Configuration
PROJECT_ID = "final-year-project-501711"
BUCKET_NAME = "urbancore-satellite-imagery"
SERVICE_ACCOUNT_KEY = "./gee_key.json"
LOCATION = "us"  # Multi-region for better availability

def create_bucket():
    """Create GCS bucket if it doesn't exist."""
    
    # Load credentials
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_KEY,
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    
    # Initialize client
    client = storage.Client(credentials=credentials, project=PROJECT_ID)
    
    # Check if bucket exists
    bucket = client.bucket(BUCKET_NAME)
    
    if bucket.exists():
        print(f"✓ Bucket already exists: gs://{BUCKET_NAME}")
    else:
        print(f"Creating bucket: gs://{BUCKET_NAME}")
        
        # Create bucket
        bucket = client.create_bucket(
            BUCKET_NAME,
            location=LOCATION
        )
        
        print(f"✓ Bucket created: gs://{BUCKET_NAME}")
        print(f"  Location: {LOCATION}")
    
    # Set bucket properties
    bucket.storage_class = "STANDARD"
    bucket.patch()
    
    # Create folder structure
    print("\nCreating folder structure...")
    blob = bucket.blob("analyses/.keep")
    blob.upload_from_string("")
    print("✓ Created 'analyses/' folder")
    
    # Display bucket info
    print(f"\n{'='*60}")
    print("Bucket Information:")
    print(f"{'='*60}")
    print(f"Name: {bucket.name}")
    print(f"Location: {bucket.location}")
    print(f"Storage Class: {bucket.storage_class}")
    print(f"Time Created: {bucket.time_created}")
    print(f"URL: https://console.cloud.google.com/storage/browser/{BUCKET_NAME}")
    
    # Check permissions
    print(f"\n{'='*60}")
    print("Testing Permissions:")
    print(f"{'='*60}")
    
    # Test write permission
    test_blob = bucket.blob("test_write.txt")
    try:
        test_blob.upload_from_string("Test write permission")
        print("✓ Write permission: OK")
        test_blob.delete()
    except Exception as e:
        print(f"✗ Write permission: FAILED - {e}")
    
    # Test read permission
    try:
        list(bucket.list_blobs(max_results=1))
        print("✓ Read permission: OK")
    except Exception as e:
        print(f"✗ Read permission: FAILED - {e}")
    
    print(f"\n{'='*60}")
    print("Setup Complete!")
    print(f"{'='*60}")
    print(f"\nAdd this to your .env file:")
    print(f"GCS_BUCKET_NAME={BUCKET_NAME}")
    print(f"GCS_PROJECT_ID={PROJECT_ID}")
    print("\nYour backend is now ready to use Google Cloud Storage!")

if __name__ == "__main__":
    try:
        create_bucket()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nMake sure:")
        print("1. Service account key exists at ./gee_key.json")
        print("2. Service account has 'Storage Admin' role")
        print("3. Cloud Storage API is enabled in your GCP project")
