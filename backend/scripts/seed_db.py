import sys
import os

# Add the parent directory to sys.path to import api modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from api.database import engine, init_db, SimulationTemplate

def seed_data():
    init_db()
    with Session(engine) as session:
        # Check if already seeded
        existing = session.exec(select(SimulationTemplate)).first()
        if existing:
            print("Database already contains data. Skipping seed.")
            return

        templates = [
            SimulationTemplate(
                id="1",
                name="Balkan Equilibrium",
                nations={
                    "Turkey": 10000,
                    "Greece": 10000,
                    "Bulgaria": 10000,
                    "Serbia": 10000,
                    "Romania": 10000,
                    "Hungary": 10000,
                },
            ),
            SimulationTemplate(
                id="2",
                name="Eastern Tensions",
                nations={
                    "Turkey": 25000,
                    "Greece": 12000,
                    "Bulgaria": 8000,
                    "Russia": 40000,
                },
            ),
            SimulationTemplate(
                id="3",
                name="Custom Crisis",
                nations={
                    "Turkey": 5000,
                    "Syria": 15000,
                    "Iraq": 12000,
                },
            ),
        ]

        for template in templates:
            session.add(template)
        
        session.commit()
        print(f"Successfully seeded {len(templates)} simulation templates.")

if __name__ == "__main__":
    seed_data()
