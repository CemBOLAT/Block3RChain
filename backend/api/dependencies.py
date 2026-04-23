from typing import Dict, Optional
from .websocket import ConnectionManager
from .orchestrator import OrchestratorState
from fastapi import HTTPException

manager = ConnectionManager()
simulations: Dict[str, OrchestratorState] = {}

def get_manager():
    return manager

def get_state(simulation_id: str):
    if simulation_id not in simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulations[simulation_id]
