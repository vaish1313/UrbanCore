# UrbanCore Installation Guide

Complete step-by-step installation guide for UrbanCore platform.

---

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows 10/11
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 100GB+ free space
- **GPU**: NVIDIA GPU with 8GB+ VRAM (recommended for AI inference)

### Software Requirements
- **Docker**: 24.0+ and Docker Compose 2.0+
- **Git**: 2.30+
- **Node.js**: 20+ (for local frontend development)
- **Python**: 3.11+ (for local backend development)

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/urbancore.git
cd urbancore
```

### 2. Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and configure:

```env
# Database
POSTGRES_SERVER=postgres
POSTGRES_DB=urbancore
POSTGRES_USER=urbancore_user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Security
SECRET_KEY=YOUR_VERY_LONG_SECRET_KEY_HERE  # Generate with: openssl rand -hex 32

# Google Earth Engine (Required for satellite download)
GEE_SERVICE_ACCOUNT_EMAIL=your-account@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=/app/gee-private-key.json

# AWS S3 (Required for file storage)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=urbancore-storage

# Email (Optional - for notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@urbancore.com

# SMS (Optional - for notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token  # Optional
```

### 3. Set Up Google Earth Engine

1. Create a Google Earth Engine account: https://earthengine.google.com/
2. Create a service account in Google Cloud Console
3. Download the private key JSON file
4. Place the key file: `backend/gee-private-key.json`

### 4. Download AI Model Checkpoints

#### U-Net Model
If you have a pretrained U-Net model:
```bash
mkdir -p backend/ai/checkpoints
# Copy your model checkpoint
cp /path/to/unet_best.pth backend/ai/checkpoints/
```

#### SAM Model
Download the Segment Anything Model checkpoint:
```bash
cd backend/ai/checkpoints
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth
```

### 5. Start the Application

#### Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d
```

This will start all services:
- PostgreSQL with PostGIS
- Redis
- FastAPI Backend
- Celery Worker
- Celery Beat
- Flower (Celery monitoring)
- Next.js Frontend
- Nginx

#### Check Status

```bash
docker-compose ps
```

All services should show "Up" status.

### 6. Initialize the Database

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Create initial violation types (already in init.sql)
docker-compose exec postgres psql -U urbancore_user -d urbancore -f /docker-entrypoint-initdb.d/init.sql
```

### 7. Create Admin User

```bash
docker-compose exec backend python -c "
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
admin = User(
    email='admin@urbancore.com',
    hashed_password=get_password_hash('admin123'),
    full_name='Admin User',
    role='admin',
    is_active=True,
    is_verified=True
)
db.add(admin)
db.commit()
print('Admin user created!')
"
```

### 8. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Flower (Celery)**: http://localhost:5555

Login credentials:
- Email: `admin@urbancore.com`
- Password: `admin123`

**⚠️ Important**: Change the admin password immediately after first login!

---

## Verification

### Test Backend

```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "app": "UrbanCore",
  "version": "1.0.0"
}
```

### Test Frontend

Open http://localhost:3000 in your browser. You should see the landing page.

### Test Database Connection

```bash
docker-compose exec postgres psql -U urbancore_user -d urbancore -c "SELECT version();"
```

### Test Celery Worker

```bash
docker-compose logs celery_worker
```

Should show "celery@... ready."

---

## Training the AI Model (Optional)

If you want to train your own building detection model:

### 1. Prepare Training Data

Organize your data:
```
data/
├── training/
│   ├── images/
│   │   ├── img001.tif
│   │   └── ...
│   └── masks/
│       ├── img001.tif
│       └── ...
├── validation/
│   ├── images/
│   └── masks/
└── test/
    ├── images/
    └── masks/
```

### 2. Mount Data Volume

Edit `docker-compose.yml` to add your data directory:
```yaml
volumes:
  - /path/to/your/data:/data
```

### 3. Run Training

```bash
docker-compose exec backend python ai/training/train.py \
  --epochs 100 \
  --batch-size 8 \
  --learning-rate 1e-4 \
  --device cuda
```

### 4. Monitor Training

```bash
# View TensorBoard
docker-compose exec backend tensorboard --logdir=/logs/tensorboard --host=0.0.0.0
```

Access TensorBoard at http://localhost:6006

---

## Troubleshooting

### Backend won't start

**Check logs**:
```bash
docker-compose logs backend
```

**Common issues**:
- Database connection failed: Check `POSTGRES_*` env vars
- Port 8000 already in use: Stop other services or change port in docker-compose.yml

### Frontend won't build

**Check Node.js version**:
```bash
node --version  # Should be 20+
```

**Clear cache and rebuild**:
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Celery tasks not running

**Check Celery worker logs**:
```bash
docker-compose logs celery_worker
```

**Check Redis connection**:
```bash
docker-compose exec redis redis-cli ping
```

### Google Earth Engine authentication fails

**Verify service account**:
- Check email in `.env` matches GCP service account
- Ensure private key file exists and path is correct
- Verify Earth Engine API is enabled in GCP

### Database initialization fails

**Reset database**:
```bash
docker-compose down -v
docker-compose up -d postgres
# Wait for postgres to be ready
docker-compose up -d
```

---

## Updating

### Pull Latest Changes

```bash
git pull origin main
```

### Rebuild Containers

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Run Database Migrations

```bash
docker-compose exec backend alembic upgrade head
```

---

## Production Deployment

### 1. Use Production Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Set Up SSL/TLS

Use Let's Encrypt with Certbot:

```bash
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

Uncomment HTTPS section in `nginx/nginx.conf`.

### 3. Configure Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. Set Up Monitoring

Install monitoring stack (optional):
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

Includes:
- Prometheus
- Grafana
- Alertmanager

### 5. Configure Backups

Set up automated database backups:

```bash
# Add to crontab
0 2 * * * docker-compose exec -T postgres pg_dump -U urbancore_user urbancore > /backup/urbancore_$(date +\%Y\%m\%d).sql
```

---

## Uninstallation

### Stop and Remove Containers

```bash
docker-compose down
```

### Remove Volumes (⚠️ This deletes all data)

```bash
docker-compose down -v
```

### Remove Images

```bash
docker rmi urbancore_backend urbancore_frontend
```

---

## Support

- **Documentation**: https://docs.urbancore.com
- **Issues**: https://github.com/yourusername/urbancore/issues
- **Email**: support@urbancore.com

---

**Next Steps**: See [README.md](README.md) for usage instructions and [API.md](API.md) for API documentation.
