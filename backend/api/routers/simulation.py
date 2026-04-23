from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from typing import List
from sqlmodel import select, Session
import uuid
from ..dependencies import get_state, get_manager, simulations, OrchestratorState, ConnectionManager
from ..database import get_session, SimulationTemplate, SimulationTemplateRead
from ..schemas import SimulationStart

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
