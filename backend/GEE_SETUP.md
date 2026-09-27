# Google Earth Engine Setup Guide

This guide walks you through setting up Google Earth Engine and Google Drive for the UrbanCore backend.

## Prerequisites

- Google account
- Google Cloud Platform access

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Project name: `urbancore-backend` (or your choice)
4. Click "Create"
5. Wait for project creation to complete

## Step 2: Enable Required APIs

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search and enable the following APIs:
   - **Earth Engine API**
   - **Google Drive API**

## Step 3: Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Service account details:
   - Name: `urbancore-backend`
   - Description: `Service account for UrbanCore satellite analysis`
4. Click "Create and Continue"
5. Grant roles (optional for now, skip)
6. Click "Done"

## Step 4: Generate Service Account Key

1. Find your service account in the list
2. Click the three dots (⋮) → "Manage keys"
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create"
6. **Important:** The JSON file will download automatically
7. Rename it to `gee_key.json`
8. Move it to your backend directory: `urban-core/backend/gee_key.json`

**⚠️ Keep this file secure! Never commit it to Git.**

## Step 5: Register Service Account with Earth Engine

1. Open the downloaded `gee_key.json` file
2. Copy the `client_email` value (looks like: `urbancore-backend@project-id.iam.gserviceaccount.com`)
3. Go to [Earth Engine Code Editor](https://code.earthengine.google.com)
4. Sign in with your Google account
5. Click on "Assets" tab in the left panel
6. Click the settings gear icon
7. Under "Cloud Project", link your project:
   - Click "Select a Cloud Project"
   - Choose the project you created in Step 1
8. Register the service account:
   - Run this command in your terminal (install gcloud CLI first if needed):
   ```bash
   earthengine authenticate
   ```
   - Or use the Python API:
   ```python
   import ee
   ee.Authenticate()
   ```

## Step 6: Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder named `UrbanCore_Data`
3. Right-click the folder → "Share"
4. Add your service account email (from `gee_key.json`)
   - Email: `urbancore-backend@project-id.iam.gserviceaccount.com`
   - Permission: **Editor**
5. Click "Share"
6. Get the folder ID:
   - Open the folder in Drive
   - Copy the ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - The folder ID is the long string after `/folders/`

## Step 7: Configure Backend Environment

1. Open `urban-core/backend/.env`
2. Update the following variables:

```env
# Google Earth Engine
GEE_SERVICE_ACCOUNT_EMAIL=urbancore-backend@YOUR-PROJECT-ID.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=./gee_key.json
GOOGLE_DRIVE_FOLDER_ID=YOUR_FOLDER_ID_FROM_STEP_6
GOOGLE_DRIVE_FOLDER_NAME=UrbanCore_Data
```

Replace:
- `YOUR-PROJECT-ID` with your actual Google Cloud project ID
- `YOUR_FOLDER_ID_FROM_STEP_6` with the folder ID from Drive

## Step 8: Test the Setup

1. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Test with a sample request:
```bash
curl -X POST "http://localhost:8000/api/v1/analyses" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 20.0059,
    "longitude": 73.7912,
    "radius_m": 2000,
    "end_year": 2026
  }'
```

3. Check the response - should show `status: "exporting"`

4. Monitor the Google Drive folder - GeoTIFF files should appear in 5-15 minutes

## Troubleshooting

### "Earth Engine credentials not configured"
- Verify `GEE_SERVICE_ACCOUNT_EMAIL` and `GEE_PRIVATE_KEY_PATH` in `.env`
- Check that `gee_key.json` exists at the specified path

### "Service account does not have Earth Engine enabled"
- Make sure you registered the service account with Earth Engine (Step 5)
- Try running `earthengine authenticate` in terminal

### "Permission denied" when writing to Drive
- Verify the Drive folder is shared with your service account email
- Check that permission level is "Editor", not "Viewer"

### "Folder not found" error
- Double-check the `GOOGLE_DRIVE_FOLDER_ID` in `.env`
- Ensure the folder name matches `GOOGLE_DRIVE_FOLDER_NAME`

### Exports not appearing in Drive
- Wait 5-15 minutes - Earth Engine exports are asynchronous
- Check GEE task status in Earth Engine Code Editor → Tasks tab
- Verify coordinates are valid (within -90 to 90 lat, -180 to 180 lon)

## Security Best Practices

1. **Never commit `gee_key.json` to version control**
   - Add to `.gitignore`:
   ```
   gee_key.json
   *.json
   ```

2. **Restrict service account permissions**
   - Only grant necessary APIs
   - Use separate service accounts for production

3. **Rotate keys periodically**
   - Delete old keys in Cloud Console
   - Generate new keys every 90 days

4. **Monitor usage**
   - Check Cloud Console for API usage
   - Set up billing alerts

## Cost Considerations

- **Earth Engine:** Free tier includes 10,000 asset operations/month
- **Google Drive:** 15 GB free storage per account
- **API Calls:** Generally free within quotas

For production deployments, consider:
- Google Cloud Storage instead of Drive (more reliable, better pricing)
- Earth Engine Premium (higher quotas, SLA)
- Cloud SQL for persistent analysis storage

## Next Steps

Once setup is complete:
1. Test the full workflow with a real location
2. Verify GeoTIFF files are exported correctly
3. Check file format (should be cloud-optimized GeoTIFF)
4. Ensure model can read the downloaded files
5. Monitor Drive storage usage

## Support

- [Earth Engine Documentation](https://developers.google.com/earth-engine)
- [Google Drive API Docs](https://developers.google.com/drive)
- [Cloud Console](https://console.cloud.google.com)
