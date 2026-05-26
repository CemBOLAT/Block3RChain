from enum import IntEnum
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel

from engine.alliance_parameters import AllianceParameters
from engine.game_parameters import GameParameters

AllianceOutcomeLiteral = Literal[
    "STABLE",
    "NO_STABLE_PARTITION",
]

class PipelinePhase(IntEnum):
    """Block mining phase. Production uses PHASE_1 only; 2/3 reserved for a future multi-round pipeline."""
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
    population: int = 10
    happiness: int = 75
    rivals: List[str] = []

class BlockSubmission(BaseModel):
    country_id: str
    block_hash: str
    phase: PipelinePhase
    reward_claimed: int
    updated_ledger: Dict[str, int] 
    updated_gold_ledger: Optional[Dict[str, int]] = None
    updated_pop_ledger: Optional[Dict[str, int]] = None
    updated_castle_ledger: Optional[Dict[str, List[int]]] = None
    updated_tax_ledger: Optional[Dict[str, float]] = None
    updated_happiness_ledger: Optional[Dict[str, int]] = None
    nonce: int
    predicted_alliances: Optional[List[List[str]]] = None
    alliance_stability_score: Optional[float] = None
    alliance_status: Optional[AllianceOutcomeLiteral] = None
    alliance_ledger_updates: Optional[Dict[str, int]] = None
    gold_ledger_updates: Optional[Dict[str, int]] = None
    pop_ledger_updates: Optional[Dict[str, int]] = None
    castle_ledger_updates: Optional[Dict[str, List[int]]] = None
    happiness_ledger_updates: Optional[Dict[str, int]] = None
    economic_deaths: Optional[Dict[str, int]] = None
    unhappy_emigration: Optional[Dict[str, int]] = None

class CountryAdd(BaseModel):
    country_id: str
    starting_troops: int = 10000
    starting_gold: int = 5000
    starting_population: int = 10
    starting_happiness: int = 75

class CountryRemove(BaseModel):
    country_id: str

class SimulationStart(BaseModel):
    name: str
    nations: Dict[str, NationData]
    alliance_parameters: AllianceParameters | None = None
    game_parameters: GameParameters | None = None

class SaveSimulation(BaseModel):
    name: str
    simulation_id: str
