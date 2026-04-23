from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from typing import List
from sqlmodel import select, Session
import uuid
from ..dependencies import get_state, get_manager, simulations, OrchestratorState, ConnectionManager
from ..database import get_session, SimulationTemplate, SimulationTemplateRead, SavedSimulation, SavedBlock
from ..schemas import SimulationStart, SaveSimulation
from emulator.core import Block

router = APIRouter(tags=["Simulation"])

@router.post("/api/simulation/start")
async def start_simulation(config: SimulationStart, manager: ConnectionManager = Depends(get_manager)):
    """Initializes and starts a new simulation based on user configuration."""
    simulation_id = str(uuid.uuid4())
    new_state = OrchestratorState(simulation_id, manager)
    new_state.initialize(config.nations)
    simulations[simulation_id] = new_state
    
    print(f"[DEBUG] Started Simulation {simulation_id} for {config.name}")
    return {
        "message": "Simulation started successfully", 
        "simulation_id": simulation_id
    }

@router.post("/api/simulation/{simulation_id}/save")
async def save_simulation(
    simulation_id: str, 
    req: SaveSimulation, 
    state: OrchestratorState = Depends(get_state), 
    session: Session = Depends(get_session)
):
    """Saves the current simulation state including the entire chain to the database."""
    # 1. Create the Simulation Entry
    new_save = SavedSimulation(
        name=req.name,
        ledger=state.troop_ledger,
        alliances=state.alliances
    )
    session.add(new_save)
    session.flush() # Get the ID before committing
    
    # 2. Save each block in the chain as a separate record
    for block in state.chain:
        db_block = SavedBlock(
            save_id=new_save.id,
            index=block.index,
            previous_hash=block.previous_hash,
            mempool=block.mempool,
            nonce=block.nonce,
            timestamp=block.timestamp,
            difficulty=block.difficulty,
            hash=block.hash
        )
        session.add(db_block)
    
    session.commit()
    return {"message": "Simulation saved successfully", "id": new_save.id}

@router.get("/api/simulation/saved")
def get_saved_simulations(session: Session = Depends(get_session)):
    """Fetch all saved simulations from the database."""
    return session.exec(select(SavedSimulation)).all()

@router.post("/api/simulation/load/{saved_id}")
async def load_simulation(
    saved_id: int, 
    manager: ConnectionManager = Depends(get_manager), 
    session: Session = Depends(get_session)
):
    """Loads a saved simulation state from the database."""
    saved = session.get(SavedSimulation, saved_id)
    if not saved:
        raise HTTPException(status_code=404, detail="Saved simulation not found")
    
    # Fetch all blocks for this simulation sorted by index
    db_blocks = session.exec(
        select(SavedBlock).where(SavedBlock.save_id == saved_id).order_by(SavedBlock.index)
    ).all()
    
    simulation_id = str(uuid.uuid4())
    new_state = OrchestratorState(simulation_id, manager)
    
    # Manually re-initialize from saved data
    new_state.troop_ledger = saved.ledger
    new_state.alliances = saved.alliances
    new_state.active_miners = list(saved.ledger.keys())
    
    # Reconstruct chain from DB blocks
    reconstructed_chain = []
    for b_data in db_blocks:
        block = Block(
            index=b_data.index,
            previous_hash=b_data.previous_hash,
            mempool=b_data.mempool,
            nonce=b_data.nonce,
            timestamp=b_data.timestamp,
            difficulty=b_data.difficulty
        )
        block.hash = b_data.hash
        reconstructed_chain.append(block)
    
    new_state.chain = reconstructed_chain
    new_state.latest_block = reconstructed_chain[-1] if reconstructed_chain else None
    new_state.is_initialized = True
    
    simulations[simulation_id] = new_state
    return {"message": "Simulation loaded", "simulation_id": simulation_id}

@router.websocket("/ws/state/{simulation_id}")
async def websocket_endpoint(websocket: WebSocket, simulation_id: str, manager: ConnectionManager = Depends(get_manager), state: OrchestratorState = Depends(get_state)):
    await manager.connect(websocket, simulation_id)
    try:
        await state.broadcast()
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, simulation_id)

@router.get("/api/simulation/{simulation_id}/state")
def get_simulation_state(state: OrchestratorState = Depends(get_state)):
    """Frontend will poll this to render the D3 map."""
    return state.get_state_data()

@router.get("/api/simulation/templates", response_model=List[SimulationTemplateRead])
def get_simulation_templates(session: Session = Depends(get_session)):
    """Fetch all available simulation templates from the database."""
    try:
        templates = session.exec(select(SimulationTemplate)).all()
        if not templates:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No simulation templates found in the database."
            )
        return templates
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to fetch templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve simulation templates."
        )
