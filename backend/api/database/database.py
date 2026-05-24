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
                "Turkey": {"troops": 10000, "gold": 170000, "population": 85},
                "Greece": {"troops": 5000, "gold": 20000, "population": 10},
                "Bulgaria": {"troops": 3000, "gold": 14000, "population": 7},
                "Serbia": {"troops": 3000, "gold": 14000, "population": 7},
                "Romania": {"troops": 9000, "gold": 38000, "population": 19},
                "Hungary": {"troops": 5000, "gold": 20000, "population": 10},
                "Bosnia and Herz.": {"troops": 1000, "gold": 6000, "population": 3},
            },
        ),
        SimulationTemplate(
            id="2",
            name="Eastern Tensions",
            nations={
                "Turkey": {"troops": 10000, "gold": 170000, "population": 85},
                "Ukraine": {"troops": 19000, "gold": 76000, "population": 38},
                "Poland": {"troops": 19000, "gold": 76000, "population": 38},
                "Russia": {"troops": 72000, "gold": 288000, "population": 144},
                "Belarus": {"troops": 4000, "gold": 18000, "population": 9},
            },
        ),
        SimulationTemplate(
            id="3",
            name="Levant Crisis",
            nations={
                "Turkey": {"troops": 10000, "gold": 170000, "population": 85},
                "Syria": {"troops": 11000, "gold": 44000, "population": 22},
                "Iraq": {"troops": 22000, "gold": 88000, "population": 44},
                "Lebanon": {"troops": 2000, "gold": 10000, "population": 5},
                "Jordan": {"troops": 5000, "gold": 22000, "population": 11},
                "Israel": {"troops": 4000, "gold": 18000, "population": 9},
                "Palestine": {"troops": 2000, "gold": 10000, "population": 5},
            },
        ),
        SimulationTemplate(
            id="4",
            name="Western Europe Standoff",
            nations={
                "United Kingdom": {"troops": 33000, "gold": 134000, "population": 67},
                "France": {"troops": 34000, "gold": 136000, "population": 68},
                "Germany": {"troops": 41000, "gold": 166000, "population": 83},
                "Italy": {"troops": 29000, "gold": 118000, "population": 59},
                "Spain": {"troops": 23000, "gold": 94000, "population": 47},
                "Netherlands": {"troops": 8000, "gold": 34000, "population": 17},
                "Belgium": {"troops": 5000, "gold": 22000, "population": 11},
            },
        ),
        SimulationTemplate(
            id="5",
            name="Gulf Superpowers",
            nations={
                "Saudi Arabia": {"troops": 18000, "gold": 72000, "population": 36},
                "United Arab Emirates": {"troops": 5000, "gold": 20000, "population": 10},
                "Qatar": {"troops": 1000, "gold": 6000, "population": 3},
                "Oman": {"troops": 2000, "gold": 10000, "population": 5},
                "Kuwait": {"troops": 2000, "gold": 8000, "population": 4},
                "Iran": {"troops": 44000, "gold": 176000, "population": 88},
            },
        ),
        SimulationTemplate(
            id="6",
            name="North American Summit",
            nations={
                "United States of America": {"troops": 166000, "gold": 666000, "population": 333},
                "Canada": {"troops": 19000, "gold": 76000, "population": 38},
                "Mexico": {"troops": 63000, "gold": 254000, "population": 127},
            },
        ),
        SimulationTemplate(
            id="7",
            name="South American Alliance",
            nations={
                "Brazil": {"troops": 107000, "gold": 430000, "population": 215},
                "Argentina": {"troops": 23000, "gold": 92000, "population": 46},
                "Chile": {"troops": 9000, "gold": 38000, "population": 19},
                "Colombia": {"troops": 26000, "gold": 104000, "population": 52},
                "Peru": {"troops": 17000, "gold": 68000, "population": 34},
            },
        ),
        SimulationTemplate(
            id="8",
            name="Central African Core",
            nations={
                "Dem. Rep. Congo": {"troops": 49000, "gold": 198000, "population": 99},
                "Central African Rep.": {"troops": 2000, "gold": 10000, "population": 5},
                "Angola": {"troops": 18000, "gold": 72000, "population": 36},
                "Gabon": {"troops": 1000, "gold": 5000, "population": 2},
                "Cameroon": {"troops": 14000, "gold": 56000, "population": 28},
            },
        ),
        SimulationTemplate(
            id="9",
            name="East Asian Giants",
            nations={
                "China": {"troops": 706000, "gold": 2824000, "population": 1412},
                "Japan": {"troops": 62000, "gold": 250000, "population": 125},
                "South Korea": {"troops": 26000, "gold": 104000, "population": 52},
                "North Korea": {"troops": 13000, "gold": 52000, "population": 26},
                "Taiwan": {"troops": 12000, "gold": 48000, "population": 24},
            },
        ),
        SimulationTemplate(
            id="10",
            name="Oceanic Front",
            nations={
                "Australia": {"troops": 13000, "gold": 52000, "population": 26},
                "New Zealand": {"troops": 2000, "gold": 10000, "population": 5},
                "Papua New Guinea": {"troops": 5000, "gold": 20000, "population": 10},
                "Fiji": {"troops": 1000, "gold": 5000, "population": 1},
            },
        ),
        SimulationTemplate(
            id="11",
            name="Nordic Council",
            nations={
                "Norway": {"troops": 2000, "gold": 10000, "population": 5},
                "Sweden": {"troops": 5000, "gold": 20000, "population": 10},
                "Finland": {"troops": 3000, "gold": 12000, "population": 6},
                "Denmark": {"troops": 3000, "gold": 12000, "population": 6},
                "Iceland": {"troops": 1000, "gold": 5000, "population": 1},
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
