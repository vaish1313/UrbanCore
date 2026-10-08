"""Validate and report metadata/statistics for the processed Nashik DEM."""

from pathlib import Path
import argparse
import json

import numpy as np
import rasterio
from rasterio.warp import transform_geom
from shapely.geometry import shape


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RASTER = ROOT / "backend" / "data" / "dem" / "processed" / "Nashik_DEM_GLO30.tif"
DEFAULT_BOUNDARY = ROOT / "backend" / "data" / "restricted_zones" / "boundary" / "nashik_district_boundary.geojson"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("raster", nargs="?", type=Path, default=DEFAULT_RASTER)
    parser.add_argument("--boundary", type=Path, default=DEFAULT_BOUNDARY)
    args = parser.parse_args()

    with rasterio.open(args.raster) as src:
        data = src.read(1)
        nodata = src.nodata
        invalid = ~np.isfinite(data)
        nodata_mask = invalid | (data == nodata if nodata is not None else np.zeros(data.shape, bool))
        valid = ~nodata_mask
        values = data[valid]
        raster_bounds = src.bounds
        with args.boundary.open(encoding="utf-8") as fh:
            boundary = json.load(fh)
        boundary_crs = boundary["crs"]["properties"]["name"]
        transformed_features = [
            shape(transform_geom(boundary_crs, src.crs, f["geometry"]))
            for f in boundary["features"]
        ]
        boundary_bounds = (
            min(g.bounds[0] for g in transformed_features),
            min(g.bounds[1] for g in transformed_features),
            max(g.bounds[2] for g in transformed_features),
            max(g.bounds[3] for g in transformed_features),
        )
        covers_boundary = (
            raster_bounds.left <= boundary_bounds[0]
            and raster_bounds.bottom <= boundary_bounds[1]
            and raster_bounds.right >= boundary_bounds[2]
            and raster_bounds.top >= boundary_bounds[3]
        )
        print(f"path: {args.raster.resolve()}")
        print(f"crs: {src.crs}")
        print(f"bands: {src.count}")
        print(f"dtype: {src.dtypes[0]}")
        print(f"nodata: {nodata}")
        print(f"resolution: {src.res}")
        print(f"dimensions: {src.width} x {src.height}")
        print(f"transform: {src.transform}")
        print(f"bounds: {raster_bounds}")
        print(f"boundary_bounds_in_raster_crs: {boundary_bounds}")
        print(f"covers_boundary_bbox: {covers_boundary}")
        print(f"valid_pixels: {int(valid.sum())}")
        print(f"nodata_pixels: {int(nodata_mask.sum())}")
        print(f"valid_percent: {100 * valid.mean():.6f}")
        print(f"nodata_percent: {100 * nodata_mask.mean():.6f}")
        print(f"nonfinite_pixels: {int(invalid.sum())}")
        if values.size:
            print(f"min: {values.min():.6f}")
            print(f"max: {values.max():.6f}")
            print(f"mean: {values.mean():.6f}")
            print(f"median: {np.median(values):.6f}")


if __name__ == "__main__":
    main()
