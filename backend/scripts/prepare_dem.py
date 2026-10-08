"""Prepare the Nashik Copernicus DEM mosaic and clipped UTM raster."""

from pathlib import Path
import json
import zipfile

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.mask import mask
from rasterio.merge import merge
from rasterio.warp import calculate_default_transform, reproject, transform_geom
from shapely.geometry import shape


ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "backend" / "data" / "dem" / "raw"
PROCESSED = ROOT / "backend" / "data" / "dem" / "processed"
BOUNDARY = ROOT / "backend" / "data" / "restricted_zones" / "boundary" / "nashik_district_boundary.geojson"
OUTPUT = PROCESSED / "Nashik_DEM_GLO30.tif"


def extract_sources() -> list[Path]:
    tiffs = []
    for archive in sorted(RAW.glob("P5_PAN_CD_*_30m.zip")):
        with zipfile.ZipFile(archive) as zf:
            members = [m for m in zf.namelist() if m.lower().endswith((".tif", ".tiff"))]
            if len(members) != 1:
                raise RuntimeError(f"Expected one TIFF in {archive.name}, found {members}")
            zf.extract(members[0], RAW)
            tiffs.append(RAW / members[0])
    if len(tiffs) != 4:
        raise RuntimeError(f"Expected four source archives, found {len(tiffs)}")
    return tiffs


def main() -> None:
    sources = extract_sources()
    with rasterio.Env():
        datasets = [rasterio.open(path) for path in sources]
        try:
            mosaic, mosaic_transform = merge(datasets, nodata=-32768, dtype="float32")
            source_crs = datasets[0].crs
            source_bounds = rasterio.transform.array_bounds(mosaic.shape[1], mosaic.shape[2], mosaic_transform)
        finally:
            for ds in datasets:
                ds.close()

        with BOUNDARY.open(encoding="utf-8") as fh:
            geojson = json.load(fh)
        boundary_crs = geojson["crs"]["properties"]["name"]
        geometries = [
            transform_geom(boundary_crs, source_crs, feature["geometry"])
            for feature in geojson["features"]
        ]

        mosaic_profile = {
            "driver": "GTiff",
            "height": mosaic.shape[1],
            "width": mosaic.shape[2],
            "count": 1,
            "dtype": "float32",
            "crs": source_crs,
            "transform": mosaic_transform,
            "nodata": -32768.0,
        }
        with rasterio.io.MemoryFile() as memfile:
            with memfile.open(**mosaic_profile) as mosaic_ds:
                mosaic_ds.write(mosaic)
                clipped, clipped_transform = mask(
                    mosaic_ds,
                    geometries,
                    crop=True,
                    nodata=-32768.0,
                )
        clipped = clipped.astype("float32", copy=False)

        dst_crs = "EPSG:32643"
        dst_transform, dst_width, dst_height = calculate_default_transform(
            source_crs,
            dst_crs,
            clipped.shape[2],
            clipped.shape[1],
            *rasterio.transform.array_bounds(clipped.shape[1], clipped.shape[2], clipped_transform),
        )
        destination = np.full((dst_height, dst_width), -32768.0, dtype="float32")
        reproject(
            source=clipped[0],
            destination=destination,
            src_transform=clipped_transform,
            src_crs=source_crs,
            src_nodata=-32768.0,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            dst_nodata=-32768.0,
            resampling=Resampling.bilinear,
            init_dest_nodata=True,
        )

        PROCESSED.mkdir(parents=True, exist_ok=True)
        profile = {
            "driver": "GTiff",
            "height": dst_height,
            "width": dst_width,
            "count": 1,
            "dtype": "float32",
            "crs": dst_crs,
            "transform": dst_transform,
            "nodata": -32768.0,
            "compress": "deflate",
            "predictor": 3,
        }
        with rasterio.open(OUTPUT, "w", **profile) as dst:
            dst.write(destination, 1)
            dst.update_tags(software="UrbanCore DEM preparation", resampling="bilinear")
        print(f"Wrote {OUTPUT}")
        print(f"Mosaic bounds: {source_bounds}")


if __name__ == "__main__":
    main()
