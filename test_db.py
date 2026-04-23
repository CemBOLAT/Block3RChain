from sqlmodel import Session, create_engine, SQLModel
from backend.api.database.models import SavedSimulation, SavedBlock
import json

engine = create_engine("sqlite:///backend/block3rchain.db")
SQLModel.metadata.create_all(engine)

try:
    with Session(engine) as session:
        new_save = SavedSimulation(name="test", ledger={}, alliances=[])
        session.add(new_save)
        session.flush()
        print("Save created:", new_save.id)
        
        db_block = SavedBlock(
            save_id=new_save.id,
            index=0,
            previous_hash="abc",
            mempool={},
            nonce=0,
            timestamp=123.456,
            difficulty=4,
            hash="def",
            miner=None,
            reward=0
        )
        session.add(db_block)
        session.commit()
        print("Block created")
except Exception as e:
    print("ERROR:", str(e))
