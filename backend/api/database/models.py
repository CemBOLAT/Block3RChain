from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlmodel import SQLModel, Field, JSON, Column

class SimulationTemplate(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    name: str
    nations: Dict[str, int] = Field(default_factory=dict, sa_column=Column(JSON))

class SavedSimulation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    timestamp: datetime = Field(default_factory=datetime.now)
    ledger: Dict[str, int] = Field(default_factory=dict, sa_column=Column(JSON))
    alliances: List[str] = Field(default_factory=list, sa_column=Column(JSON))

class SavedBlock(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    save_id: int = Field(foreign_key="savedsimulation.id")
    index: int
    previous_hash: str
    mempool: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    nonce: int
    timestamp: float
    difficulty: int
    hash: str

class SimulationTemplateCreate(SQLModel):
    id: str
    name: str
    nations: Dict[str, int]

class SimulationTemplateRead(SQLModel):
    id: str
    name: str
    nations: Dict[str, int]
