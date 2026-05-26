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
                "Turkey": {"troops": 10000, "gold": 170000, "population": 85, "happiness": 75},
                "Greece": {"troops": 5000, "gold": 20000, "population": 10, "happiness": 75},
                "Bulgaria": {"troops": 3000, "gold": 14000, "population": 7, "happiness": 75},
                "Serbia": {"troops": 3000, "gold": 14000, "population": 7, "happiness": 75},
                "Romania": {"troops": 9000, "gold": 38000, "population": 19, "happiness": 75},
                "Hungary": {"troops": 5000, "gold": 20000, "population": 10, "happiness": 75},
                "Bosnia and Herz.": {"troops": 1000, "gold": 6000, "population": 3, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="2",
            name="Eastern Tensions",
            nations={
                "Turkey": {"troops": 10000, "gold": 170000, "population": 85, "happiness": 75},
                "Ukraine": {"troops": 19000, "gold": 76000, "population": 38, "happiness": 75},
                "Poland": {"troops": 19000, "gold": 76000, "population": 38, "happiness": 75},
                "Russia": {"troops": 72000, "gold": 288000, "population": 144, "happiness": 75},
                "Belarus": {"troops": 4000, "gold": 18000, "population": 9, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="3",
            name="Levant Crisis",
            nations={
                "Turkey": {"troops": 10000, "gold": 170000, "population": 85, "happiness": 75},
                "Syria": {"troops": 11000, "gold": 44000, "population": 22, "happiness": 75},
                "Iraq": {"troops": 22000, "gold": 88000, "population": 44, "happiness": 75},
                "Lebanon": {"troops": 2000, "gold": 10000, "population": 5, "happiness": 75},
                "Jordan": {"troops": 5000, "gold": 22000, "population": 11, "happiness": 75},
                "Israel": {"troops": 4000, "gold": 18000, "population": 9, "happiness": 75},
                "Palestine": {"troops": 2000, "gold": 10000, "population": 5, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="4",
            name="Western Europe Standoff",
            nations={
                "United Kingdom": {"troops": 33000, "gold": 134000, "population": 67, "happiness": 75},
                "France": {"troops": 34000, "gold": 136000, "population": 68, "happiness": 75},
                "Germany": {"troops": 41000, "gold": 166000, "population": 83, "happiness": 75},
                "Italy": {"troops": 29000, "gold": 118000, "population": 59, "happiness": 75},
                "Spain": {"troops": 23000, "gold": 94000, "population": 47, "happiness": 75},
                "Netherlands": {"troops": 8000, "gold": 34000, "population": 17, "happiness": 75},
                "Belgium": {"troops": 5000, "gold": 22000, "population": 11, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="5",
            name="Gulf Superpowers",
            nations={
                "Saudi Arabia": {"troops": 18000, "gold": 72000, "population": 36, "happiness": 75},
                "United Arab Emirates": {"troops": 5000, "gold": 20000, "population": 10, "happiness": 75},
                "Qatar": {"troops": 1000, "gold": 6000, "population": 3, "happiness": 75},
                "Oman": {"troops": 2000, "gold": 10000, "population": 5, "happiness": 75},
                "Kuwait": {"troops": 2000, "gold": 8000, "population": 4, "happiness": 75},
                "Iran": {"troops": 44000, "gold": 176000, "population": 88, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="6",
            name="North American Summit",
            nations={
                "United States of America": {"troops": 166000, "gold": 666000, "population": 333, "happiness": 75},
                "Canada": {"troops": 19000, "gold": 76000, "population": 38, "happiness": 75},
                "Mexico": {"troops": 63000, "gold": 254000, "population": 127, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="7",
            name="South American Alliance",
            nations={
                "Brazil": {"troops": 107000, "gold": 430000, "population": 215, "happiness": 75},
                "Argentina": {"troops": 23000, "gold": 92000, "population": 46, "happiness": 75},
                "Chile": {"troops": 9000, "gold": 38000, "population": 19, "happiness": 75},
                "Colombia": {"troops": 26000, "gold": 104000, "population": 52, "happiness": 75},
                "Peru": {"troops": 17000, "gold": 68000, "population": 34, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="8",
            name="Central African Core",
            nations={
                "Dem. Rep. Congo": {"troops": 49000, "gold": 198000, "population": 99, "happiness": 75},
                "Central African Rep.": {"troops": 2000, "gold": 10000, "population": 5, "happiness": 75},
                "Angola": {"troops": 18000, "gold": 72000, "population": 36, "happiness": 75},
                "Gabon": {"troops": 1000, "gold": 5000, "population": 2, "happiness": 75},
                "Cameroon": {"troops": 14000, "gold": 56000, "population": 28, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="9",
            name="East Asian Giants",
            nations={
                "China": {"troops": 706000, "gold": 2824000, "population": 1412, "happiness": 75},
                "Japan": {"troops": 62000, "gold": 250000, "population": 125, "happiness": 75},
                "South Korea": {"troops": 26000, "gold": 104000, "population": 52, "happiness": 75},
                "North Korea": {"troops": 13000, "gold": 52000, "population": 26, "happiness": 75},
                "Taiwan": {"troops": 12000, "gold": 48000, "population": 24, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="10",
            name="Oceanic Front",
            nations={
                "Australia": {"troops": 13000, "gold": 52000, "population": 26, "happiness": 75},
                "New Zealand": {"troops": 2000, "gold": 10000, "population": 5, "happiness": 75},
                "Papua New Guinea": {"troops": 5000, "gold": 20000, "population": 10, "happiness": 75},
                "Fiji": {"troops": 1000, "gold": 5000, "population": 1, "happiness": 75},
            },
        ),
        SimulationTemplate(
            id="11",
            name="Nordic Council",
            nations={
                "Norway": {"troops": 2000, "gold": 10000, "population": 5, "happiness": 75},
                "Sweden": {"troops": 5000, "gold": 20000, "population": 10, "happiness": 75},
                "Finland": {"troops": 3000, "gold": 12000, "population": 6, "happiness": 75},
                "Denmark": {"troops": 3000, "gold": 12000, "population": 6, "happiness": 75},
                "Iceland": {"troops": 1000, "gold": 5000, "population": 1, "happiness": 75},
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
