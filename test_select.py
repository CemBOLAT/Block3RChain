from sqlmodel import Session, create_engine, SQLModel, select
from backend.api.database.models import SavedBlock

engine = create_engine("sqlite:///backend/block3rchain.db")
try:
    with Session(engine) as session:
        session.exec(select(SavedBlock)).first()
        print("Success")
except Exception as e:
    print("ERROR:", str(e))
