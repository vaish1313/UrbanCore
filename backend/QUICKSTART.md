# UrbanCore Backend Quick Start Guide

Get the backend running in 5 minutes!

## Prerequisites

- Python 3.10 or higher
- pip package manager
- Google Cloud account (for Earth Engine)
- Supabase account

## Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 2: Configure Environment

1. Copy the example environment file:
```bash
# Windows
copy .env .env.backup

# Linux/Mac
cp .env .env.backup
```

2. Edit `backend/.env` with your credentials:

```env
# Required: Add your Supabase credentials
SUPABASE_URL=https://ttrarpuojnrmxcsftqph.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_-ul2QjiFjntgXkp6doa-rA_kdbJ7U2Y
SUPABASE_PROJECT_ID=ttrarpuojnrmxcsftqph

# Required: Add Google Earth Engine credentials
GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=./gee_key.json
GOOGLE_DRIVE_FOLDER_ID=18nZsT7n6xm50pJ_Fl8R9K3eFejflvMwm
GOOGLE_DRIVE_FOLDER_NAME=UrbanCore_Data

# Model configuration
UNET_CHECKPOINT_PATH=../outputs/best_unet_urbancore.pth
DEVICE=cpu  # or 'cuda' if GPU available
ENABLE_SAM=true

# Optional: HuggingFace token for SAM-3D
HF_TOKEN=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

# API configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Step 3: Setup Google Earth Engine (First Time Only)

If you haven't setup GEE yet, follow these quick steps:

1. Create a Google Cloud project
2. Enable Earth Engine API and Google Drive API
3. Create a service account
4. Download the JSON key file as `gee_key.json`
5. Place it in the `backend/` directory
6. Share your Google Drive folder with the service account email

**Detailed instructions:** See `GEE_SETUP.md`

## Step 4: Verify Model File

Ensure the UNet model exists:
```bash
# Check if model file exists
ls ../outputs/best_unet_urbancore.pth
```

If the file doesn't exist, you'll need to either:
- Train the model
- Download a pre-trained checkpoint
- Update `UNET_CHECKPOINT_PATH` in `.env`

## Step 5: Run the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Step 6: Test the API

### 1. Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "UrbanCore API is running"
}
```

### 2. Test Location Search
```bash
curl "http://localhost:8000/api/v1/locations/search?q=Nashik,%20India"
```

### 3. Create Test Analysis
```bash
curl -X POST http://localhost:8000/api/v1/analyses \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 20.0059,
    "longitude": 73.7912,
    "radius_m": 2000,
    "end_year": 2026
  }'
```

Save the returned `id` for checking status.

### 4. Check Analysis Status
```bash
curl http://localhost:8000/api/v1/analyses/YOUR_ANALYSIS_ID
```

## Step 7: Access API Documentation

Open your browser and visit:

- **Swagger UI (Interactive):** http://localhost:8000/docs
- **ReDoc (Reference):** http://localhost:8000/redoc

You can test all endpoints directly from the Swagger UI!

## Common Issues & Quick Fixes

### Issue: "Module not found"
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Issue: "GEE credentials not configured"
- Check that `gee_key.json` exists in `backend/` directory
- Verify `GEE_SERVICE_ACCOUNT_EMAIL` matches the email in `gee_key.json`
- Ensure `GEE_PRIVATE_KEY_PATH` points to the correct file

### Issue: "Supabase not configured"
- Verify `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are set
- Check that credentials are valid (test in Supabase dashboard)

### Issue: "Model checkpoint not found"
- Check that model file exists: `../outputs/best_unet_urbancore.pth`
- Update `UNET_CHECKPOINT_PATH` if file is in a different location
- Temporarily disable model inference to test other features

### Issue: Port 8000 already in use
```bash
# Use a different port
uvicorn app.main:app --reload --port 8001
```

### Issue: CORS errors in frontend
- Add your frontend URL to `CORS_ORIGINS` in `.env`
- Restart the server after changes

## Development Workflow

### Making Changes

1. Edit files in `backend/app/`
2. Server auto-reloads (if using `--reload` flag)
3. Test changes via Swagger UI or curl
4. Check logs for errors

### Adding New Dependencies

```bash
# Install package
pip install package-name

# Update requirements
pip freeze > requirements.txt
```

### Debugging

```bash
# Run with debug logging
DEBUG=True uvicorn app.main:app --reload --log-level debug
```

## Production Deployment

### Option 1: Docker

```bash
# Build image
docker build -t urbancore-backend .

# Run container
docker run -p 8000:8000 --env-file .env urbancore-backend
```

### Option 2: Gunicorn

```bash
# Install gunicorn
pip install gunicorn

# Run with workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Option 3: Cloud Platform

Deploy to:
- **Google Cloud Run** (recommended for GEE integration)
- **AWS Lambda** (with API Gateway)
- **Azure Functions**
- **Railway** / **Render** / **Fly.io**

## Next Steps

1. **Complete Setup**
   - Follow `GEE_SETUP.md` for detailed Google Cloud configuration
   - Configure Supabase authentication
   - Test with real coordinates

2. **Integrate Frontend**
   - Update frontend API URL to `http://localhost:8000`
   - Implement map visualization
   - Add user authentication flow

3. **Test Complete Workflow**
   - Register a user
   - Search for location
   - Create analysis
   - Monitor progress
   - View results

4. **Read Documentation**
   - `README.md` - Complete overview
   - `API_DOCUMENTATION.md` - API reference
   - `IMPLEMENTATION_SUMMARY.md` - Technical details

## Useful Commands

```bash
# Check Python version
python --version

# Install specific Python version (Windows)
py -3.10 -m pip install -r requirements.txt

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows)
.\.venv\Scripts\activate

# Activate virtual environment (Linux/Mac)
source .venv/bin/activate

# Deactivate virtual environment
deactivate

# Run tests (if available)
pytest

# Check code style
black app/
flake8 app/

# View logs in real-time
tail -f logs/urbancore.log
```

## Getting Help

1. Check the error message in terminal
2. Review the relevant documentation file
3. Verify environment variables are set correctly
4. Check Google Cloud Console for GEE/Drive issues
5. Test each component independently
6. Enable debug logging for detailed errors

## Success Checklist

- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] GEE service account setup
- [ ] Google Drive folder shared
- [ ] Model checkpoint available
- [ ] Server starts without errors
- [ ] Health check passes
- [ ] Location search works
- [ ] Can create analysis
- [ ] API documentation accessible

Once all checked, you're ready to integrate with the frontend!

## Quick Reference

| What | Command/URL |
|------|-------------|
| Start server | `uvicorn app.main:app --reload` |
| API docs | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |
| View logs | Check terminal output |
| Stop server | Ctrl+C |
| Backend dir | `cd backend` |
| Install deps | `pip install -r requirements.txt` |

---

**Congratulations!** 🎉 Your UrbanCore backend is now running!
