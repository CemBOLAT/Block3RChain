from fastapi import APIRouter, Depends

from ..dependencies import get_state, OrchestratorState
from ..schemas import AllianceParameters

router = APIRouter(prefix="/api/simulation/{simulation_id}/config", tags=["Config"])


@router.post("/alliance_parameters")
async def update_alliance_parameters(
    body: AllianceParameters,
    state: OrchestratorState = Depends(get_state),
):
    """Update solver alliance parameters for the active simulation (equilibrium only)."""
    await state.update_alliance_parameters(body)
    return {
        "message": "Alliance parameters updated.",
        "alliance_parameters": state.alliance_parameters.model_dump(),
    }
