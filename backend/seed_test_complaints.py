"""
UrbanCore Synthetic Complaints Seed Script (Test Data Only)
Targets strictly URB-TEST-2026-0001 through URB-TEST-2026-0010.
Does not delete, modify, or interact with genuine user complaints.
"""
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text

# Load backend environment and database engine
backend_dir = Path(__file__).resolve().parent
load_dotenv(backend_dir / ".env")
sys.path.insert(0, str(backend_dir))

from app.complaints_service import engine

EXPECTED_REFERENCES = {
    f"URB-TEST-2026-{str(i).zfill(4)}" for i in range(1, 11)
}

TARGET_REFERENCES = tuple(sorted(EXPECTED_REFERENCES))

TEST_COMPLAINTS = [
    {
        "reference_number": "URB-TEST-2026-0001",
        "citizen_name": "[TEST] Rajesh Deshmukh",
        "title": "[TEST] Unauthorized Foundation Digging",
        "description": "Deep excavation underway without municipal setback compliance or permit board.",
        "status": "New",
        "latitude": 20.0063,
        "longitude": 73.7645,
        "location_name": "College Road, Nashik",
        "hours_ago": 1,
    },
    {
        "reference_number": "URB-TEST-2026-0002",
        "citizen_name": "[TEST] Priya Kulkarni",
        "title": "[TEST] Encroachment on Natural Nala",
        "description": "Concrete retaining wall erected directly over natural stormwater channel.",
        "status": "SUBMITTED",
        "latitude": 20.0215,
        "longitude": 73.7438,
        "location_name": "Gangapur Road, Anandwalli",
        "hours_ago": 3,
    },
    {
        "reference_number": "URB-TEST-2026-0003",
        "citizen_name": "[TEST] Amit Patil",
        "title": "[TEST] Green Belt Buffer Violation",
        "description": "Commercial shed erected inside designated green buffer zone boundary.",
        "status": "New",
        "latitude": 19.9650,
        "longitude": 73.7782,
        "location_name": "Indira Nagar, Nashik",
        "hours_ago": 6,
    },
    {
        "reference_number": "URB-TEST-2026-0004",
        "citizen_name": "[TEST] Sunita Shinde",
        "title": "[TEST] Unapproved Commercial Plinth",
        "description": "RCC columns cast exceeding permissible floor-space index limits.",
        "status": "Under Review",
        "latitude": 20.0092,
        "longitude": 73.7925,
        "location_name": "Panchavati, near Ramkund",
        "hours_ago": 24,
    },
    {
        "reference_number": "URB-TEST-2026-0005",
        "citizen_name": "[TEST] Vikram Jadhav",
        "title": "[TEST] Hill Slope Cut for Private Road",
        "description": "Steep slope earth-cutting without retaining protection posing landslide risk.",
        "status": "Under Review",
        "latitude": 19.9482,
        "longitude": 73.7610,
        "location_name": "Pathardi Phata, Nashik",
        "hours_ago": 36,
    },
    {
        "reference_number": "URB-TEST-2026-0006",
        "citizen_name": "[TEST] Sneha Joshi",
        "title": "[TEST] Construction Debris in River Bed",
        "description": "Demolition rubble dumped into the Godavari blue flood line zone.",
        "status": "Action Taken",
        "latitude": 20.0287,
        "longitude": 73.7294,
        "location_name": "Godavari Riverbank, Someshwar",
        "hours_ago": 72,
    },
    {
        "reference_number": "URB-TEST-2026-0007",
        "citizen_name": "[TEST] Nilesh Gaikwad",
        "title": "[TEST] Notice Served for Setback Violation",
        "description": "Side marginal space encroached by unauthorized cantilevered extension.",
        "status": "Action Taken",
        "latitude": 19.9721,
        "longitude": 73.7490,
        "location_name": "Cidco Sector 4, Nashik",
        "hours_ago": 96,
    },
    {
        "reference_number": "URB-TEST-2026-0008",
        "citizen_name": "[TEST] Kavita More",
        "title": "[TEST] Resolved Plinth Demolition",
        "description": "Encroached perimeter plinth cleared following municipal notice.",
        "status": "Closed",
        "latitude": 19.9950,
        "longitude": 73.7315,
        "location_name": "Satpur MIDC Link Rd",
        "hours_ago": 168,
    },
    {
        "reference_number": "URB-TEST-2026-0009",
        "citizen_name": "[TEST] Manoj Sonawane",
        "title": "[TEST] Illegal Compound Wall Cleared",
        "description": "Unauthorized wall obstructing road widening cleared by owner.",
        "status": "Closed",
        "latitude": 19.9540,
        "longitude": 73.8340,
        "location_name": "Nashik Road, near Station",
        "hours_ago": 240,
    },
    {
        "reference_number": "URB-TEST-2026-0010",
        "citizen_name": "[TEST] Anonymous Citizen",
        "title": "[TEST] Phone Report (Missing GPS Coordinates)",
        "description": "Verbal telephone complaint regarding night concrete pouring. Coordinates missing.",
        "status": "New",
        "latitude": None,
        "longitude": None,
        "location_name": "Govind Nagar, Nashik",
        "hours_ago": 2,
    },
]

UPSERT_SQL = text("""
    INSERT INTO complaints (
        reference_number, citizen_name, title, description,
        status, latitude, longitude, location_name,
        geometry, created_at, updated_at
    ) VALUES (
        :reference_number, :citizen_name, :title, :description,
        :status, :latitude, :longitude, :location_name,
        CASE 
            WHEN :latitude IS NOT NULL AND :longitude IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
            ELSE NULL 
        END,
        :created_at, :created_at
    )
    ON CONFLICT (reference_number) DO UPDATE SET
        citizen_name = EXCLUDED.citizen_name,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location_name = EXCLUDED.location_name,
        geometry = EXCLUDED.geometry,
        updated_at = CURRENT_TIMESTAMP;
""")

def validate_test_dataset():
    actual_refs = {item["reference_number"] for item in TEST_COMPLAINTS}
    if actual_refs != EXPECTED_REFERENCES:
        raise ValueError(
            f"Dataset validation failed!\n"
            f"Expected: {sorted(EXPECTED_REFERENCES)}\n"
            f"Found: {sorted(actual_refs)}"
        )
    if len(TEST_COMPLAINTS) != 10:
        raise ValueError(f"Expected exactly 10 complaints, got {len(TEST_COMPLAINTS)}")

def seed():
    # 1. Safeguard Validation
    validate_test_dataset()

    # 2. Pre-insert Target Host Confirmation (Without Credentials)
    db_url = engine.url
    print("=" * 60)
    print("URBANCORE TEST SEED PRE-CHECK")
    print(f"Target Database : {db_url.database}")
    print(f"Target Host     : {db_url.host}:{db_url.port or 5432}")
    print(f"Target Dialect  : {db_url.drivername}")
    print(f"Records to seed : exactly 10 synthetic test complaints")
    print("=" * 60)

    now = datetime.now(timezone.utc)

    # Pre-execution query restricted to the exact 10 target references
    with engine.connect() as conn:
        pre_total = conn.execute(text("SELECT COUNT(*) FROM complaints")).scalar()
        pre_non_test = conn.execute(
            text("SELECT COUNT(*) FROM complaints WHERE reference_number NOT IN :refs"),
            {"refs": TARGET_REFERENCES}
        ).scalar()
        pre_seeded = conn.execute(
            text("SELECT COUNT(*) FROM complaints WHERE reference_number IN :refs"),
            {"refs": TARGET_REFERENCES}
        ).scalar()

    print(f"Pre-seed Total Complaints     : {pre_total}")
    print(f"Pre-seed Non-test Complaints  : {pre_non_test}")
    print(f"Pre-seed Existing Test Refs   : {pre_seeded}")

    # 3. Execute Seed with explicit transaction
    with engine.begin() as conn:
        for item in TEST_COMPLAINTS:
            ts = now - timedelta(hours=item["hours_ago"])
            conn.execute(UPSERT_SQL, {
                "reference_number": item["reference_number"],
                "citizen_name": item["citizen_name"],
                "title": item["title"],
                "description": item["description"],
                "status": item["status"],
                "latitude": item["latitude"],
                "longitude": item["longitude"],
                "location_name": item["location_name"],
                "created_at": ts,
            })

    # 4. Post-Execution Verification restricted strictly to TARGET_REFERENCES
    with engine.connect() as conn:
        post_total = conn.execute(text("SELECT COUNT(*) FROM complaints")).scalar()
        post_non_test = conn.execute(
            text("SELECT COUNT(*) FROM complaints WHERE reference_number NOT IN :refs"),
            {"refs": TARGET_REFERENCES}
        ).scalar()
        post_test_count = conn.execute(
            text("SELECT COUNT(*) FROM complaints WHERE reference_number IN :refs"),
            {"refs": TARGET_REFERENCES}
        ).scalar()
        
        # Verify non-test count was untouched
        assert pre_non_test == post_non_test, "CRITICAL: Non-test complaints count changed!"
        assert post_test_count == 10, f"Expected 10 test records, found {post_test_count}"
        assert post_total == pre_non_test + post_test_count, "Total count mismatch!"

        print("\nPOST-EXECUTION INTEGRITY VERIFICATION:")
        print(f"  Total records in table : {post_total} (was {pre_total})")
        print(f"  Non-test records       : {post_non_test} (unchanged)")
        print(f"  Seeded test records    : {post_test_count} (exactly 10)")

        print("\nVerified Test Records:")
        rows = conn.execute(
            text("""
                SELECT 
                    reference_number, 
                    status, 
                    latitude, 
                    longitude, 
                    location_name,
                    (latitude IS NOT NULL AND longitude IS NOT NULL) AS has_coords,
                    (geometry IS NOT NULL AND ST_IsValid(geometry)) AS valid_geom,
                    (geometry IS NULL) AS is_geom_null,
                    created_at, 
                    updated_at
                FROM complaints
                WHERE reference_number IN :refs
                ORDER BY reference_number ASC
            """),
            {"refs": TARGET_REFERENCES}
        ).fetchall()

        valid_geom_count = 0
        null_geom_count = 0

        seed_dict = {item["reference_number"]: item for item in TEST_COMPLAINTS}
        for r in rows:
            expected = seed_dict[r.reference_number]
            assert r.status == expected["status"], f"Status mismatch for {r.reference_number}: {r.status} != {expected['status']}"
            if expected["latitude"] is not None:
                assert abs(float(r.latitude) - expected["latitude"]) < 1e-4, f"Lat mismatch for {r.reference_number}"
                assert abs(float(r.longitude) - expected["longitude"]) < 1e-4, f"Lon mismatch for {r.reference_number}"
            else:
                assert r.latitude is None and r.longitude is None, f"Coords not None for {r.reference_number}"

            if r.valid_geom and r.has_coords:
                valid_geom_count += 1
            elif r.latitude is None and r.longitude is None and r.is_geom_null:
                null_geom_count += 1

            coords_str = f"({r.latitude:.4f}, {r.longitude:.4f})" if r.has_coords else "NULL"
            print(f"  [{r.reference_number}] Status: {r.status:<12} Coords: {coords_str:<22} ValidGeom: {str(r.valid_geom):<5} NullGeom: {str(r.is_geom_null):<5} Loc: {r.location_name}")

        assert valid_geom_count == 9, f"Expected 9 valid geometries, got {valid_geom_count}"
        assert null_geom_count == 1, f"Expected 1 null geometry, got {null_geom_count}"

        print(f"\nDataset match validation: All 10 records match seed statuses and coordinates.")
        print(f"Geometry validation: {valid_geom_count} valid PostGIS Point geometries, {null_geom_count} null geometry.")
        print("Seeding complete and all integrity safeguards verified.")

if __name__ == "__main__":
    seed()
