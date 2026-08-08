"""
Nashik District AOI Seeder.

Why this file exists:
Provides a one-time (but idempotent) data population script for the 30 canonical
Nashik district Areas of Interest that form the operational basis of UrbanCore's
geospatial analysis platform.

Idempotency:
The script checks for the existence of each AOI by its unique `aoi_id_code` before
inserting. Re-running the script on an already-seeded database is completely safe
and produces no duplicates.

Usage:
    python -m backend.app.db.seeds.seed_aois
    # or via Makefile:
    make seed-aois
"""

import asyncio
import uuid
from typing import Optional

from sqlalchemy import select, text

from backend.app.db.models.aoi import AOI, AOICategory
from backend.app.db.models.project import Project, ProjectStatus
from backend.app.db.models.user import User
from backend.app.db.models.user_role import UserRole
from backend.app.db.models.role import Role
from backend.app.db.session import session_scope


# ==========================================
# AOI Data
# ==========================================

# Raw AOI definitions: (aoi_id_code, name, min_lon, min_lat, max_lon, max_lat)
_RAW_AOIS: list[tuple[str, str, float, float, float, float]] = [
    ("AOI_01", "CBS",                           73.773655, 19.992237, 73.792855, 20.010237),
    ("AOI_02", "Canada Corner",                 73.758351, 19.998098, 73.777551, 20.016098),
    ("AOI_03", "College Road",                  73.753327, 19.997042, 73.772527, 20.015042),
    ("AOI_04", "Panchavati",                    73.777351, 20.001490, 73.796551, 20.019490),
    ("AOI_05", "Mumbai Naka",                   73.774544, 19.978897, 73.793744, 19.996897),
    ("AOI_06", "Gangapur Road",                 73.713451, 20.014862, 73.732651, 20.032862),
    ("AOI_07", "Makhmalabad",                   73.726344, 20.014052, 73.745544, 20.032052),
    ("AOI_08", "Pathardi Phata",                73.763334, 19.934892, 73.782534, 19.952892),
    ("AOI_09", "Indira Nagar",                  73.740543, 19.990431, 73.759743, 20.008431),
    ("AOI_10", "CIDCO",                         73.804892, 19.983124, 73.824092, 20.001124),
    ("AOI_11", "Untwadi",                       73.791023, 19.973412, 73.810223, 19.991412),
    ("AOI_12", "Adgaon",                        73.820134, 19.952341, 73.839334, 19.970341),
    ("AOI_13", "Satpur MIDC",                   73.734521, 19.998234, 73.753721, 20.016234),
    ("AOI_14", "Ambad MIDC",                    73.764823, 19.952134, 73.784023, 19.970134),
    ("AOI_15", "Gonde MIDC",                    73.674523, 20.008234, 73.693723, 20.026234),
    ("AOI_16", "Sinnar MIDC",                   74.008234, 19.847234, 74.027434, 19.865234),
    ("AOI_17", "Dindori Road",                  73.742341, 20.028934, 73.761541, 20.046934),
    ("AOI_18", "Ozar",                          73.921234, 20.084523, 73.940434, 20.102523),
    ("AOI_19", "Pimpalgaon Baswant",            74.082341, 20.114523, 74.101541, 20.132523),
    ("AOI_20", "Sinnar Outskirts",              74.002341, 19.852341, 74.021541, 19.870341),
    ("AOI_21", "Vilholi",                       73.842341, 19.942341, 73.861541, 19.960341),
    ("AOI_22", "Godavari River (Ramkund)",      73.782341, 19.992341, 73.801541, 20.010341),
    ("AOI_23", "Gangapur Dam Downstream",       73.692341, 20.002341, 73.711541, 20.020341),
    ("AOI_24", "Someshwar River Belt",          73.772341, 20.022341, 73.791541, 20.040341),
    ("AOI_25", "Trimbakeshwar",                 73.512341, 19.932341, 73.531541, 19.950341),
    ("AOI_26", "Anjaneri",                      73.682341, 20.052341, 73.701541, 20.070341),
    ("AOI_27", "Harihar Fort Region",           73.602341, 20.022341, 73.621541, 20.040341),
    ("AOI_28", "Nashik-Mumbai Highway",         73.387086, 19.593386, 73.406286, 19.611386),
    ("AOI_29", "Nashik-Pune Highway",           74.019325, 19.137112, 74.038525, 19.155112),
    ("AOI_30", "Nashik-Aurangabad Highway",     74.559296, 20.002582, 74.578496, 20.020582),
]

# Explicit name → category mapping.
_CATEGORY_MAP: dict[str, AOICategory] = {
    # Urban
    "CBS":                          AOICategory.URBAN,
    "Canada Corner":                AOICategory.URBAN,
    "College Road":                 AOICategory.URBAN,
    "Panchavati":                   AOICategory.URBAN,
    "Mumbai Naka":                  AOICategory.URBAN,
    "Indira Nagar":                 AOICategory.URBAN,
    # Industrial
    "Ambad MIDC":                   AOICategory.INDUSTRIAL,
    "Satpur MIDC":                  AOICategory.INDUSTRIAL,
    "Gonde MIDC":                   AOICategory.INDUSTRIAL,
    "Sinnar MIDC":                  AOICategory.INDUSTRIAL,
    "CIDCO":                        AOICategory.INDUSTRIAL,
    # Residential
    "Adgaon":                       AOICategory.RESIDENTIAL,
    "Makhmalabad":                  AOICategory.RESIDENTIAL,
    "Untwadi":                      AOICategory.RESIDENTIAL,
    "Vilholi":                      AOICategory.RESIDENTIAL,
    "Pathardi Phata":               AOICategory.RESIDENTIAL,
    # Highway
    "Nashik-Mumbai Highway":        AOICategory.HIGHWAY,
    "Nashik-Pune Highway":          AOICategory.HIGHWAY,
    "Nashik-Aurangabad Highway":    AOICategory.HIGHWAY,
    "Gangapur Road":                AOICategory.HIGHWAY,
    "Dindori Road":                 AOICategory.HIGHWAY,
    # River
    "Godavari River (Ramkund)":     AOICategory.RIVER,
    "Gangapur Dam Downstream":      AOICategory.RIVER,
    "Someshwar River Belt":         AOICategory.RIVER,
    # Rural / Forest
    "Harihar Fort Region":          AOICategory.RURAL_FOREST,
    "Trimbakeshwar":                AOICategory.RURAL_FOREST,
    "Ozar":                         AOICategory.RURAL_FOREST,
    "Sinnar Outskirts":             AOICategory.RURAL_FOREST,
    "Pimpalgaon Baswant":           AOICategory.RURAL_FOREST,
    "Anjaneri":                     AOICategory.RURAL_FOREST,
}


# ==========================================
# Helpers
# ==========================================

def _build_polygon_wkt(min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> str:
    """
    Constructs a closed WKT POLYGON string from bounding box coordinates.

    The ring is defined counter-clockwise (CCW) in compliance with the GeoJSON /
    OGC Simple Features right-hand rule:
        bottom-left → bottom-right → top-right → top-left → bottom-left

    Args:
        min_lon: Western boundary longitude.
        min_lat: Southern boundary latitude.
        max_lon: Eastern boundary longitude.
        max_lat: Northern boundary latitude.

    Returns:
        A valid WKT POLYGON string.
    """
    return (
        f"POLYGON(("
        f"{min_lon} {min_lat}, "
        f"{max_lon} {min_lat}, "
        f"{max_lon} {max_lat}, "
        f"{min_lon} {max_lat}, "
        f"{min_lon} {min_lat}"
        f"))"
    )


async def _find_superuser_id(session) -> Optional[uuid.UUID]:
    """
    Returns the UUID of the first User who holds the SUPER_ADMIN role.
    Returns None if no superuser exists yet.
    """
    result = await session.execute(
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.name == "SUPER_ADMIN")
        .limit(1)
    )
    row = result.scalar_one_or_none()
    return row


async def _get_or_create_project(session, owner_id: Optional[uuid.UUID]) -> Optional[uuid.UUID]:
    """
    Fetches or creates the canonical 'Nashik District — Master' project.
    Returns the project UUID, or None if no owner exists and creation is skipped.
    """
    if owner_id is None:
        print("  [!] No superuser found — skipping project creation.")
        return None

    result = await session.execute(
        select(Project.id).where(Project.name == "Nashik District — Master")
    )
    existing = result.scalar_one_or_none()
    if existing:
        print(f"  [~] Project already exists: {existing}")
        return existing

    project = Project(
        name="Nashik District — Master",
        description="System-seeded master project covering all 30 Nashik AOIs.",
        owner_id=owner_id,
        status=ProjectStatus.ACTIVE,
    )
    session.add(project)
    await session.flush()  # Flush to obtain the generated UUID before committing.
    print(f"  [+] Created project: {project.id}")
    return project.id


# ==========================================
# Main Seeder
# ==========================================

async def seed_aois() -> None:
    """
    Idempotently seeds 30 Nashik AOIs into the database.

    For each AOI, the script:
    1. Checks if a record with the same `aoi_id_code` already exists.
    2. Skips if found (idempotent).
    3. Builds a WKT POLYGON from bounding box floats.
    4. Inserts using ST_GeomFromText for PostGIS compatibility.

    All inserts happen within a single atomic transaction that is committed on success
    or rolled back on any failure.
    """
    async with session_scope() as session:
        # Resolve optional project owner
        owner_id = await _find_superuser_id(session)
        project_id = await _get_or_create_project(session, owner_id)

        seeded = 0
        skipped = 0

        for aoi_id_code, name, min_lon, min_lat, max_lon, max_lat in _RAW_AOIS:
            # Idempotency check
            existing = await session.execute(
                select(AOI.id).where(AOI.aoi_id_code == aoi_id_code)
            )
            if existing.scalar_one_or_none() is not None:
                skipped += 1
                continue

            wkt = _build_polygon_wkt(min_lon, min_lat, max_lon, max_lat)
            category = _CATEGORY_MAP.get(name, AOICategory.URBAN)

            aoi = AOI(
                project_id=project_id,
                name=name,
                category=category,
                aoi_id_code=aoi_id_code,
                # Use SQLAlchemy text() to call PostGIS ST_GeomFromText inline.
                geom=text(f"ST_GeomFromText('{wkt}', 4326)"),
                min_lat=min_lat,
                min_lon=min_lon,
                max_lat=max_lat,
                max_lon=max_lon,
            )
            session.add(aoi)
            seeded += 1

        await session.commit()

    print(f"\n✓ Seeded {seeded} AOIs. Skipped {skipped} (already existed).")


if __name__ == "__main__":
    asyncio.run(seed_aois())
