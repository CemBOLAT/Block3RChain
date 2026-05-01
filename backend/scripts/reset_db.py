import os
import sys
from sqlmodel import create_engine, text
from dotenv import load_dotenv

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def reset_db():
    print("Dropping tables to apply new schema...")
    with engine.connect() as conn:
        # Drop dependent tables first
        conn.execute(text("DROP TABLE IF EXISTS savedblock CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS savedsimulation CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS simulationtemplate CASCADE;"))
        conn.commit()
    print("Tables dropped. Now run seed_db.py to recreate them.")

if __name__ == "__main__":
    reset_db()
