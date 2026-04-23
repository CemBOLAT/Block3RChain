import sys
import os

# Add the parent directory to sys.path to import api modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.database import init_db

def seed_data():
    print("Initializing database and seeding initial templates...")
    init_db()
    print("Database initialization complete.")

if __name__ == "__main__":
    seed_data()
