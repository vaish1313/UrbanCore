import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def main():
    load_dotenv('.env')
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    engine = create_engine(DATABASE_URL)
    
    with open('data/municipal/complaints_schema.sql', 'r') as f:
        schema_sql = f.read()

    with engine.connect() as conn:
        print("Running complaints migration...")
        conn.execute(text(schema_sql))
        conn.commit()
        print("Migration applied successfully.")
        
        result = conn.execute(text("SELECT COUNT(*) FROM complaints;"))
        count = result.scalar()
        print(f"complaints table created. Current count: {count}")

if __name__ == '__main__':
    main()
