from fastapi import APIRouter, HTTPException, Depends
from ..schemas import GodIntervention, CountryAdd, CountryRemove
from ..dependencies import get_state, OrchestratorState

router = APIRouter(prefix="/api/simulation/{simulation_id}/god", tags=["God-Mode"])

@router.post("/intervention")
async def god_intervention(intervention: GodIntervention, state: OrchestratorState = Depends(get_state)):
    """Triggers Phase 1 of the 15-step pipeline for troop adjustments."""
    print(f"[DEBUG] [Sim {state.id}] God Intervention API Hit: {intervention}")
    return await state.start_simulation_pipeline(
        mempool_type="GOD_INTERVENTION", 
        target=intervention.country_id, 
        extra_data={"change": intervention.troop_change}
    )

@router.post("/country/add")
async def add_country(country: CountryAdd, state: OrchestratorState = Depends(get_state)):
    """Proposes adding a new country via consensus."""
    if country.country_id in state.active_miners:
        raise HTTPException(status_code=400, detail="Country already exists.")
    
    return await state.start_simulation_pipeline(
        mempool_type="COUNTRY_ADD",
        target=country.country_id,
        extra_data={"starting_troops": country.starting_troops}
    )

@router.post("/country/remove")
async def remove_country(country: CountryRemove, state: OrchestratorState = Depends(get_state)):
    """Proposes removing a country via consensus."""
    if country.country_id not in state.active_miners:
        raise HTTPException(status_code=404, detail="Country not found.")
    
    return await state.start_simulation_pipeline(
        mempool_type="COUNTRY_REMOVE",
        target=country.country_id
    )
