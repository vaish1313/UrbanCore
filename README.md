# UrbanCore

**AI-Powered Geospatial Platform for Illegal Construction Detection**

UrbanCore is a production-ready enterprise platform that uses satellite imagery, machine learning, and GIS technology to automatically detect newly constructed buildings and identify zoning violations.

---

## 🌟 Features

### Core Capabilities
- **🛰️ Satellite Imagery Download**: Automatic download of Sentinel-2 imagery from Google Earth Engine (2021-2025)
- **🤖 AI Building Detection**: Fine-tuned U-Net deep learning model for accurate building segmentation
- **📊 Change Detection**: Multi-year comparison to identify new, removed, and expanded buildings
- **🎯 SAM Refinement**: Segment Anything Model for precise building boundary detection
- **⚠️ Violation Detection**: Automated checking against zoning regulations, protected areas, and buffer zones
- **🗺️ Terrain Analysis**: SRTM DEM analysis for elevation, slope, aspect, and terrain ruggedness
- **📈 Land Suitability Scoring**: 0-100 score based on terrain, accessibility, and environmental factors
- **📄 Professional Reports**: Auto-generated PDF reports with maps, charts, and analysis
- **✍️ AI Complaint Letters**: Automatically generated official complaints with evidence
- **🔔 Multi-Channel Notifications**: Email, SMS, and push notifications

### Interactive Map Features
- Zoom and pan
- Search by location name
- Enter coordinates (lat/long)
- Draw custom polygons
- Upload GeoJSON files
- Upload Shapefiles
- Click anywhere on map

### User Roles
- **Admin**: Full system access and user management
- **Government Officer**: Create projects, review violations, generate complaints
- **Builder**: View detection results and reports

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Next.js       │◄────►│   FastAPI        │◄────►│  PostgreSQL     │
│   Frontend      │      │   Backend        │      │  + PostGIS      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
          ┌─────────▼────┐ ┌─────▼──────┐ ┌───▼────────┐
          │   Celery     │ │   Redis    │ │  AWS S3    │
          │   Workers    │ │            │ │  Storage   │
          └──────────────┘ └────────────┘ └────────────┘
                    │
          ┌─────────┴─────────────┐
          │                       │
    ┌─────▼──────┐      ┌────────▼────────┐
    │  PyTorch   │      │  Google Earth   │
    │  U-Net/SAM │      │  Engine API     │
    └────────────┘      └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **ShadCN UI** - Component library
- **React Query** - Data fetching
- **Leaflet/Mapbox GL** - Interactive maps
- **Chart.js** - Data visualization

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL + PostGIS** - Spatial database
- **Redis** - Caching and message broker
- **Celery** - Background task queue

### AI/ML
- **PyTorch** - Deep learning framework
- **U-Net** - Building segmentation model
- **SAM** - Segment Anything Model for refinement
- **OpenCV** - Image processing
- **Rasterio/GDAL** - Geospatial data processing

### Satellite Data
- **Google Earth Engine** - Sentinel-2 imagery
- **SRTM DEM** - Terrain data

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD

---

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Google Earth Engine account (for satellite data)
- 16GB RAM minimum (32GB recommended for AI training)
- GPU recommended for AI inference

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/urbancore.git
cd urbancore
```

2. **Configure environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

3. **Set up Google Earth Engine**
```bash
# Place your GEE service account key
cp your-gee-key.json backend/gee-private-key.json
```

4. **Start the application**
```bash
docker-compose up -d
```

5. **Initialize the database**
```bash
docker-compose exec backend alembic upgrade head
```

6. **Create admin user**
```bash
docker-compose exec backend python scripts/create_admin.py
```

7. **Access the application**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Flower (Celery Monitor): http://localhost:5555

---

## 📚 API Documentation

### Authentication
```bash
# Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "builder"
}

# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Project Management
```bash
# Create project
POST /api/v1/projects
{
  "name": "Nashik Development Zone A",
  "description": "Analysis of construction in Zone A",
  "start_year": 2021,
  "end_year": 2024
}

# Get project
GET /api/v1/projects/{project_id}

# List projects
GET /api/v1/projects?skip=0&limit=10
```

### Satellite Imagery
```bash
# Download Sentinel-2 imagery
POST /api/v1/satellite/download
{
  "project_id": 1,
  "bbox": [73.78, 19.99, 73.82, 20.02],
  "years": [2021, 2022, 2023, 2024]
}
```

### Building Detection
```bash
# Run detection
POST /api/v1/detection/run
{
  "project_id": 1,
  "image_id": 5
}

# Get detection results
GET /api/v1/detection/results/{project_id}
```

For complete API documentation, visit: http://localhost:8000/docs

---

## 🎯 Usage Workflow

1. **Create Project**
   - Login as Government Officer or Admin
   - Create new project with name and description
   - Define area of interest (AOI) by drawing or uploading

2. **Download Satellite Imagery**
   - System automatically downloads Sentinel-2 imagery for specified years
   - Cloud filtering and compositing performed automatically

3. **Process Imagery**
   - Calculate vegetation indices (NDVI, NDBI, NDWI)
   - Normalize and align images
   - Generate patches for model input

4. **Run Building Detection**
   - U-Net model detects buildings in each image
   - SAM refines building boundaries
   - Results stored with confidence scores

5. **Perform Change Detection**
   - Compare multi-year results
   - Identify new, removed, and expanded buildings
   - Generate change maps

6. **Check Violations**
   - Overlay buildings with zoning layers
   - Check river buffers, flood zones, forest boundaries
   - Flag violations with severity levels

7. **Terrain Analysis**
   - Download SRTM DEM
   - Calculate elevation, slope, aspect
   - Compute land suitability scores

8. **Generate Reports**
   - Create professional PDF reports
   - Include maps, charts, and statistics
   - Export for official use

9. **Create Complaints**
   - AI generates official complaint letters
   - Include GPS coordinates and evidence
   - Attach satellite images and maps

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
POSTGRES_SERVER=postgres
POSTGRES_DB=urbancore
POSTGRES_USER=urbancore_user
POSTGRES_PASSWORD=your_secure_password

# Google Earth Engine
GEE_SERVICE_ACCOUNT_EMAIL=your-account@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=/app/gee-private-key.json

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=urbancore-storage

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
docker-compose exec backend pytest

# Run with coverage
docker-compose exec backend pytest --cov=app --cov-report=html

# Run specific test file
docker-compose exec backend pytest tests/test_detection.py
```

### Frontend Tests
```bash
# Run tests
cd frontend && npm test

# Run with coverage
npm test -- --coverage
```

---

## 📊 Model Training

### Prepare Training Data
```bash
# Organize your data
data/
├── training/
│   ├── images/
│   └── masks/
├── validation/
│   ├── images/
│   └── masks/
└── test/
    ├── images/
    └── masks/
```

### Train Model
```bash
docker-compose exec backend python ai/training/train.py \
  --epochs 100 \
  --batch-size 8 \
  --learning-rate 1e-4 \
  --device cuda
```

### Monitor Training
```bash
# TensorBoard
tensorboard --logdir=backend/logs/tensorboard
```

---

## 🚢 Deployment

### Production Deployment

1. **Update environment variables**
   - Set `DEBUG=False`
   - Configure production database
   - Set secure `SECRET_KEY`

2. **Use production Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Set up SSL certificates**
```bash
# Using Let's Encrypt
certbot certonly --standalone -d your-domain.com
```

4. **Configure domain and firewall**
   - Point DNS to your server
   - Open ports 80, 443
   - Configure firewall rules

5. **Set up monitoring**
   - Prometheus for metrics
   - Grafana for dashboards
   - Sentry for error tracking

---

## 📈 Performance

- **Building Detection**: ~500ms per 256x256 patch (GPU)
- **Change Detection**: ~2s for 1km² area
- **Violation Check**: ~100ms per building
- **Report Generation**: ~5s for comprehensive PDF
- **API Response Time**: <200ms (p95)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Google Earth Engine for satellite imagery
- Meta AI for Segment Anything Model
- PostGIS community
- Open source contributors

---

## 📞 Support

- **Email**: support@urbancore.com
- **Documentation**: https://docs.urbancore.com
- **Issues**: https://github.com/yourusername/urbancore/issues

---

## 🗺️ Roadmap

- [ ] Multi-spectral index support
- [ ] Real-time detection alerts
- [ ] Mobile app (iOS/Android)
- [ ] Integration with municipal GIS systems
- [ ] Support for additional satellite sources
- [ ] Automated drone integration
- [ ] 3D building reconstruction
- [ ] Temporal analysis and predictions

---

**Built with ❤️ for sustainable urban development**
