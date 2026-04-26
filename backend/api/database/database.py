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
                "Turkey": 15000,
                "Greece": 12000,
                "Bulgaria": 10000,
                "Serbia": 10000,
                "Romania": 12000,
                "Hungary": 11000,
                "Bosnia and Herz.": 8000,
            },
        ),
        SimulationTemplate(
            id="2",
            name="Eastern Tensions",
            nations={
                "Turkey": 25000,
                "Ukraine": 20000,
                "Poland": 18000,
                "Russia": 45000,
                "Belarus": 12000,
            },
        ),
        SimulationTemplate(
            id="3",
            name="Levant Crisis",
            nations={
                "Turkey": 20000,
                "Syria": 15000,
                "Iraq": 15000,
                "Lebanon": 8000,
                "Jordan": 10000,
                "Israel": 18000,
                "Palestine": 5000,
            },
        ),
        SimulationTemplate(
            id="4",
            name="Western Europe Standoff",
            nations={
                "United Kingdom": 25000,
                "France": 25000,
                "Germany": 25000,
                "Italy": 20000,
                "Spain": 18000,
                "Netherlands": 12000,
                "Belgium": 10000,
            },
        ),
        SimulationTemplate(
            id="5",
            name="Gulf Superpowers",
            nations={
                "Saudi Arabia": 35000,
                "United Arab Emirates": 20000,
                "Qatar": 15000,
                "Oman": 12000,
                "Kuwait": 12000,
                "Iran": 30000,
            },
        ),
        SimulationTemplate(
            id="6",
            name="North American Summit",
            nations={
                "United States of America": 50000,
                "Canada": 20000,
                "Mexico": 25000,
            },
        ),
        SimulationTemplate(
            id="7",
            name="South American Alliance",
            nations={
                "Brazil": 35000,
                "Argentina": 20000,
                "Chile": 15000,
                "Colombia": 18000,
                "Peru": 12000,
            },
        ),
        SimulationTemplate(
            id="8",
            name="Central African Core",
            nations={
                "Dem. Rep. Congo": 15000,
                "Central African Rep.": 8000,
                "Angola": 12000,
                "Gabon": 8000,
                "Cameroon": 10000,
            },
        ),
        SimulationTemplate(
            id="9",
            name="East Asian Giants",
            nations={
                "China": 50000,
                "Japan": 30000,
                "South Korea": 25000,
                "North Korea": 25000,
                "Taiwan": 15000,
            },
        ),
        SimulationTemplate(
            id="10",
            name="Oceanic Front",
            nations={
                "Australia": 25000,
                "New Zealand": 12000,
                "Papua New Guinea": 8000,
                "Fiji": 5000,
            },
        ),
        SimulationTemplate(
            id="11",
            name="Nordic Council",
            nations={
                "Norway": 15000,
                "Sweden": 15000,
                "Finland": 15000,
                "Denmark": 12000,
                "Iceland": 8000,
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
