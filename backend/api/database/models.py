from typing import Dict, Optional
from sqlmodel import SQLModel, Field, JSON, Column

class SimulationTemplate(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    name: str
    nations: Dict[str, int] = Field(default_factory=dict, sa_column=Column(JSON))

class SimulationTemplateCreate(SQLModel):
    id: str
    name: str
    nations: Dict[str, int]

class SimulationTemplateRead(SQLModel):
    id: str
    name: str
    nations: Dict[str, int]
