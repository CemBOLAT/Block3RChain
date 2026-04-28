from pydantic import BaseModel
from typing import Dict, List, Optional
from enum import IntEnum

class PipelinePhase(IntEnum):
    PHASE_1_INITIAL = 1
    PHASE_2_STABILIZATION = 2
    PHASE_3_EXECUTION = 3

class GodIntervention(BaseModel):
    country_id: str
    troop_change: int

class BlockSubmission(BaseModel):
    country_id: str
    block_hash: str
    phase: PipelinePhase
    reward_claimed: int
    updated_ledger: Dict[str, int]
    nonce: int
    predicted_alliances: Optional[List[str]] = None
    alliance_ledger_updates: Optional[Dict[str, int]] = None

class CountryAdd(BaseModel):
    country_id: str
    starting_troops: int = 10000

class CountryRemove(BaseModel):
    country_id: str

class SimulationStart(BaseModel):
    name: str
    nations: Dict[str, int]

class SaveSimulation(BaseModel):
    name: str
    simulation_id: str
