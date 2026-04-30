from fastapi import APIRouter, HTTPException, Depends
from ..schemas import GodIntervention, CountryAdd, CountryRemove
from ..dependencies import get_state, OrchestratorState

router = APIRouter(prefix="/api/simulation/{simulation_id}/god", tags=["God-Mode"])

@router.post("/intervention")
async def god_intervention(intervention: GodIntervention, state: OrchestratorState = Depends(get_state)):
    """Queues a troop adjustment intervention."""
    is_active = intervention.country_id in state.active_miners
    is_pending_add = any(i["type"] == "COUNTRY_ADD" and i["target"] == intervention.country_id for i in state.pending_interventions)
    is_pending_remove = any(i["type"] == "COUNTRY_REMOVE" and i["target"] == intervention.country_id for i in state.pending_interventions)

    if (not is_active and not is_pending_add) or is_pending_remove:
        raise HTTPException(status_code=400, detail=f"Cannot apply intervention to '{intervention.country_id}': Country does not exist or is pending removal.")

    await state.add_pending_intervention({
        "type": "GOD_INTERVENTION",
        "target": intervention.country_id,
        "change": intervention.troop_change,
        "gold_change": intervention.gold_change,
        "pop_change": intervention.pop_change
    })
    return {"message": "Intervention queued."}

@router.post("/country/add")
async def add_country(country: CountryAdd, state: OrchestratorState = Depends(get_state)):
    """Queues a country addition."""
    # Check if country already exists in active miners
    is_active = country.country_id in state.active_miners
    # Check if country is being removed in the current queue
    is_pending_remove = any(i["type"] == "COUNTRY_REMOVE" and i["target"] == country.country_id for i in state.pending_interventions)
    # Check if country is already being added in the current queue
    is_pending_add = any(i["type"] == "COUNTRY_ADD" and i["target"] == country.country_id for i in state.pending_interventions)

    if (is_active and not is_pending_remove) or is_pending_add:
        raise HTTPException(status_code=400, detail=f"Country '{country.country_id}' is already in the world or pending addition.")
    
    await state.add_pending_intervention({
        "type": "COUNTRY_ADD",
        "target": country.country_id,
        "starting_troops": country.starting_troops,
        "starting_gold": country.starting_gold,
        "population": country.population
    })
    return {"message": "Country addition queued."}

@router.post("/country/remove")
async def remove_country(country: CountryRemove, state: OrchestratorState = Depends(get_state)):
    """Queues a country removal."""
    # Check if country exists in active miners
    is_active = country.country_id in state.active_miners
    # Check if country is being added in the current queue
    is_pending_add = any(i["type"] == "COUNTRY_ADD" and i["target"] == country.country_id for i in state.pending_interventions)
    # Check if country is already being removed in the current queue
    is_pending_remove = any(i["type"] == "COUNTRY_REMOVE" and i["target"] == country.country_id for i in state.pending_interventions)

    if (not is_active and not is_pending_add) or is_pending_remove:
        raise HTTPException(status_code=400, detail=f"Country '{country.country_id}' does not exist or is already pending removal.")
    
    await state.add_pending_intervention({
        "type": "COUNTRY_REMOVE",
        "target": country.country_id
    })
    return {"message": "Country removal queued."}

@router.delete("/pending/{index}")
async def remove_pending(index: int, state: OrchestratorState = Depends(get_state)):
    """Removes a pending intervention by index."""
    await state.remove_pending_intervention(index)
    return {"message": "Intervention removed."}

@router.post("/commit")
async def commit_interventions(state: OrchestratorState = Depends(get_state)):
    """Starts the simulation pipeline with all queued interventions."""
    return await state.start_simulation_pipeline()
