import os
from sqlmodel import create_engine, Session, SQLModel, select
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    SQLModel.metadata.create_all(engine)
    seed_data()

def seed_data():
    from .models import SimulationTemplate
    
    initial_templates = [
        SimulationTemplate(
            id="1",
            name="Balkan Equilibrium",
            nations={
                "Turkey": {"troops": 15000, "gold": 5000, "population": 85},
                "Greece": {"troops": 12000, "gold": 4000, "population": 10},
                "Bulgaria": {"troops": 10000, "gold": 3000, "population": 7},
                "Serbia": {"troops": 10000, "gold": 3000, "population": 7},
                "Romania": {"troops": 12000, "gold": 4000, "population": 19},
                "Hungary": {"troops": 11000, "gold": 3500, "population": 10},
                "Bosnia and Herz.": {"troops": 8000, "gold": 2000, "population": 3},
            },
        ),
        SimulationTemplate(
            id="2",
            name="Eastern Tensions",
            nations={
                "Turkey": {"troops": 25000, "gold": 8000, "population": 85},
                "Ukraine": {"troops": 20000, "gold": 6000, "population": 38},
                "Poland": {"troops": 18000, "gold": 7000, "population": 38},
                "Russia": {"troops": 45000, "gold": 15000, "population": 144},
                "Belarus": {"troops": 12000, "gold": 3000, "population": 9},
            },
        ),
        SimulationTemplate(
            id="3",
            name="Levant Crisis",
            nations={
                "Turkey": {"troops": 20000, "gold": 7000, "population": 85},
                "Syria": {"troops": 15000, "gold": 3000, "population": 22},
                "Iraq": {"troops": 15000, "gold": 4000, "population": 44},
                "Lebanon": {"troops": 8000, "gold": 2000, "population": 5},
                "Jordan": {"troops": 10000, "gold": 3000, "population": 11},
                "Israel": {"troops": 18000, "gold": 12000, "population": 9},
                "Palestine": {"troops": 5000, "gold": 1000, "population": 5},
            },
        ),
        SimulationTemplate(
            id="4",
            name="Western Europe Standoff",
            nations={
                "United Kingdom": {"troops": 25000, "gold": 20000, "population": 67},
                "France": {"troops": 25000, "gold": 20000, "population": 68},
                "Germany": {"troops": 25000, "gold": 22000, "population": 83},
                "Italy": {"troops": 20000, "gold": 15000, "population": 59},
                "Spain": {"troops": 18000, "gold": 12000, "population": 47},
                "Netherlands": {"troops": 12000, "gold": 10000, "population": 17},
                "Belgium": {"troops": 10000, "gold": 8000, "population": 11},
            },
        ),
        SimulationTemplate(
            id="5",
            name="Gulf Superpowers",
            nations={
                "Saudi Arabia": {"troops": 35000, "gold": 30000, "population": 36},
                "United Arab Emirates": {"troops": 20000, "gold": 25000, "population": 10},
                "Qatar": {"troops": 15000, "gold": 20000, "population": 3},
                "Oman": {"troops": 12000, "gold": 8000, "population": 5},
                "Kuwait": {"troops": 12000, "gold": 15000, "population": 4},
                "Iran": {"troops": 30000, "gold": 12000, "population": 88},
            },
        ),
        SimulationTemplate(
            id="6",
            name="North American Summit",
            nations={
                "United States of America": {"troops": 50000, "gold": 50000, "population": 333},
                "Canada": {"troops": 20000, "gold": 20000, "population": 38},
                "Mexico": {"troops": 25000, "gold": 15000, "population": 127},
            },
        ),
        SimulationTemplate(
            id="7",
            name="South American Alliance",
            nations={
                "Brazil": {"troops": 35000, "gold": 18000, "population": 215},
                "Argentina": {"troops": 20000, "gold": 10000, "population": 46},
                "Chile": {"troops": 15000, "gold": 12000, "population": 19},
                "Colombia": {"troops": 18000, "gold": 8000, "population": 52},
                "Peru": {"troops": 12000, "gold": 7000, "population": 34},
            },
        ),
        SimulationTemplate(
            id="8",
            name="Central African Core",
            nations={
                "Dem. Rep. Congo": {"troops": 15000, "gold": 4000, "population": 99},
                "Central African Rep.": {"troops": 8000, "gold": 1000, "population": 5},
                "Angola": {"troops": 12000, "gold": 5000, "population": 36},
                "Gabon": {"troops": 8000, "gold": 3000, "population": 2},
                "Cameroon": {"troops": 10000, "gold": 4000, "population": 28},
            },
        ),
        SimulationTemplate(
            id="9",
            name="East Asian Giants",
            nations={
                "China": {"troops": 50000, "gold": 60000, "population": 1412},
                "Japan": {"troops": 30000, "gold": 40000, "population": 125},
                "South Korea": {"troops": 25000, "gold": 25000, "population": 52},
                "North Korea": {"troops": 25000, "gold": 5000, "population": 26},
                "Taiwan": {"troops": 15000, "gold": 20000, "population": 24},
            },
        ),
        SimulationTemplate(
            id="10",
            name="Oceanic Front",
            nations={
                "Australia": {"troops": 25000, "gold": 30000, "population": 26},
                "New Zealand": {"troops": 12000, "gold": 15000, "population": 5},
                "Papua New Guinea": {"troops": 8000, "gold": 2000, "population": 10},
                "Fiji": {"troops": 5000, "gold": 1000, "population": 1},
            },
        ),
        SimulationTemplate(
            id="11",
            name="Nordic Council",
            nations={
                "Norway": {"troops": 15000, "gold": 25000, "population": 5},
                "Sweden": {"troops": 15000, "gold": 18000, "population": 10},
                "Finland": {"troops": 15000, "gold": 15000, "population": 6},
                "Denmark": {"troops": 12000, "gold": 15000, "population": 6},
                "Iceland": {"troops": 8000, "gold": 10000, "population": 1},
            },
        ),
    ]

    with Session(engine) as session:
        # Fetch existing templates by ID
        existing_templates = {t.id: t for t in session.exec(select(SimulationTemplate)).all()}
        
        added_count = 0
        updated_count = 0

        for t in initial_templates:
            if t.id in existing_templates:
                # Update existing template
                existing = existing_templates[t.id]
                if existing.name != t.name or existing.nations != t.nations:
                    existing.name = t.name
                    existing.nations = t.nations
                    session.add(existing)
                    updated_count += 1
            else:
                # Add new template
                session.add(t)
                added_count += 1

        if added_count > 0 or updated_count > 0:
            session.commit()
            if added_count > 0:
                print(f"Successfully added {added_count} initial templates.")
            if updated_count > 0:
                print(f"Successfully updated {updated_count} existing templates.")

def get_session():
    with Session(engine) as session:
        yield session
