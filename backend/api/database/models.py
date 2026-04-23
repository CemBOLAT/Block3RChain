from datetime import datetime
from typing import Dict, List, Optional
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
    chain_data: List[Dict] = Field(default_factory=list, sa_column=Column(JSON))

class SimulationTemplateCreate(SQLModel):
    id: str
    name: str
    nations: Dict[str, int]

class SimulationTemplateRead(SQLModel):
    id: str
    name: str
    nations: Dict[str, int]
