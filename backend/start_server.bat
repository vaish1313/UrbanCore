@echo off
echo ============================================================
echo Starting UrbanCore Backend Server
echo ============================================================
echo.
echo This may take 25-30 seconds to initialize all services:
echo   - Google Earth Engine authentication
echo   - Google Cloud Storage connection
echo   - U-Net AI model loading
echo.
echo Please wait...
echo ============================================================
echo.

cd /d "%~dp0"
python start.py

pause
