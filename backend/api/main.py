from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from .database import init_db, engine, SimulationTemplate
from .routers import god, miner, simulation
from .dependencies import simulations, manager, OrchestratorState

app = FastAPI(title="Block3RChain God-Mode Orchestrator")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/state")
def get_global_state():
    """Returns the state of the most recent active simulation for discovery."""
    if not simulations:
        # Return a 'waiting' state instead of 404 to keep frontend happy
        return {
            "simulation_id": None,
            "step": 0,
            "is_initialized": False,
            "ledger": {},
            "alliances": [],
            "mempool": None,
            "chain_length": 0
        }
    
    # Return the last simulation's state
    last_id = list(simulations.keys())[-1]
    return simulations[last_id].get_state_data()

# Include Routers
app.include_router(simulation.router)
app.include_router(god.router)
app.include_router(miner.router)
