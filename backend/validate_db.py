import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('.env')

DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

queries = [
    "SELECT COUNT(*) FROM restricted_zones;",
    """
    SELECT zone_type, COUNT(*) AS feature_count
    FROM restricted_zones
    GROUP BY zone_type
    ORDER BY zone_type;
    """,
    """
    SELECT COUNT(*) AS invalid_geometries
    FROM restricted_zones
    WHERE NOT ST_IsValid(geometry);
    """
]

with engine.connect() as conn:
    for q in queries:
        print(f"\nQuery:\n{q.strip()}")
        result = conn.execute(text(q))
        for row in result:
            print(row)
        print("-" * 40)
