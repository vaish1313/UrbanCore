"""Print approved V1 suitability results for selected or all canonical AOIs."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.suitability_service import calculate_builder_aoi_suitability, get_nashik_elevation_stats  # noqa: E402
from app.builder_service import get_builder_aois  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("aoi_ids", nargs="*", help="Canonical AOI IDs; omit to report all AOIs")
    args = parser.parse_args()

    ids = args.aoi_ids or [aoi["id"] for aoi in get_builder_aois(limit=100)]
    print("District elevation reference:")
    print(json.dumps(get_nashik_elevation_stats(), indent=2))
    successes = 0
    failures = 0
    for aoi_id in ids:
        try:
            result = calculate_builder_aoi_suitability(aoi_id)
            if result is None:
                print(f"{aoi_id}: NOT FOUND")
                failures += 1
                continue
            print(json.dumps(result, indent=2))
            successes += 1
        except Exception as exc:  # pragma: no cover - CLI failure reporting
            print(f"{aoi_id}: FAILED: {exc}")
            failures += 1
    print(f"SUMMARY: succeeded={successes}, failed={failures}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
