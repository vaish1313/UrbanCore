import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def main():
    load_dotenv('.env')
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    engine = create_engine(DATABASE_URL)
    
    with open('data/municipal/municipal_cases_schema.sql', 'r') as f:
        schema_sql = f.read()

    with engine.connect() as conn:
        print("Running municipal cases migration...")
        conn.execute(text(schema_sql))
        conn.commit()
        print("Migration applied successfully.")
        
        # Verify
        result = conn.execute(text("SELECT COUNT(*) FROM municipal_cases;"))
        count = result.scalar()
        print(f"municipal_cases table created. Current count: {count}")

if __name__ == '__main__':
    main()
