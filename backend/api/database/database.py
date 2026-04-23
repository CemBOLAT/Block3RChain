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

    with Session(engine) as session:
        # Check if templates already exist to avoid duplicates
        existing_ids = session.exec(select(SimulationTemplate.id)).all()
        new_templates = [t for t in initial_templates if t.id not in existing_ids]

        if new_templates:
            session.add_all(new_templates)
            session.commit()
            print(f"Successfully added {len(new_templates)} initial templates.")

def get_session():
    with Session(engine) as session:
        yield session
