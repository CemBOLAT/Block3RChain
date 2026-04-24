import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.database import engine
from api.database.models import SimulationTemplate
from sqlmodel import Session, select

def check_templates():
    with Session(engine) as session:
        templates = session.exec(select(SimulationTemplate)).all()
        print(f"Found {len(templates)} templates:")
        for t in templates:
            print(f"ID: {t.id}, Name: {t.name}")

if __name__ == "__main__":
    check_templates()
