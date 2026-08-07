# ============================================================
# AI Service — Multi-stage Dockerfile
# Uses python-gdal base for GDAL/Rasterio compatibility
# ============================================================

FROM python:3.11-slim AS base

# Install GDAL system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libspatialindex-dev \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

ENV GDAL_VERSION=$(gdal-config --version)
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

WORKDIR /app

# ─── Stage: Dependencies ─────────────────────────────────────
FROM base AS deps

COPY pyproject.toml ./
# Install base dependencies (without ML extras — ML requires CUDA-specific torch)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e ".[dev]"

# ─── Stage: Production ───────────────────────────────────────
FROM base AS production

WORKDIR /app

COPY pyproject.toml ./
# Install production dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

# Copy shared package
COPY ../shared /app/shared
RUN pip install --no-cache-dir -e /app/shared

# Copy application
COPY app ./app
COPY tests ./tests

# Create non-root user
RUN useradd -r -s /bin/false urbancore
RUN mkdir -p /app/models && chown -R urbancore:urbancore /app
USER urbancore

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]

# ─── Stage: Development ──────────────────────────────────────
FROM deps AS development

WORKDIR /app

COPY ../shared /app/shared
RUN pip install --no-cache-dir -e /app/shared

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
