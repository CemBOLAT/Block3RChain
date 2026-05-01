from pydantic import BaseModel
from typing import Dict, List, Optional
from enum import IntEnum

class PipelinePhase(IntEnum):
    PHASE_1_INITIAL = 1
    PHASE_2_STABILIZATION = 2
    PHASE_3_EXECUTION = 3

class GodIntervention(BaseModel):
    country_id: str
    troop_change: int = 0
    gold_change: int = 0
    pop_change: int = 0

class NationData(BaseModel):
    troops: int
    gold: int = 1000
    population: int = 10 # in millions

class BlockSubmission(BaseModel):
    country_id: str
    block_hash: str
    phase: PipelinePhase
    reward_claimed: int
    updated_ledger: Dict[str, int] 
    updated_gold_ledger: Optional[Dict[str, int]] = None
    updated_pop_ledger: Optional[Dict[str, int]] = None
    nonce: int
    predicted_alliances: Optional[List[str]] = None
    alliance_ledger_updates: Optional[Dict[str, int]] = None
    gold_ledger_updates: Optional[Dict[str, int]] = None
    pop_ledger_updates: Optional[Dict[str, int]] = None
    economic_deaths: Optional[Dict[str, int]] = None

class CountryAdd(BaseModel):
    country_id: str
    starting_troops: int = 10000
    starting_gold: int = 5000
    population: int = 10

class CountryRemove(BaseModel):
    country_id: str

class SimulationStart(BaseModel):
    name: str
    nations: Dict[str, NationData]

class SaveSimulation(BaseModel):
    name: str
    simulation_id: str
