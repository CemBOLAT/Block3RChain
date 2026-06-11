from fastapi import APIRouter, HTTPException, Depends
from ..schemas import GodIntervention, CountryAdd, CountryRemove, RivalPayload
from ..dependencies import get_state, OrchestratorState
from ..god_helpers import country_exists, effective_rivals
from pydantic import BaseModel

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
        "troop_change": intervention.troop_change,
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
        "starting_population": country.starting_population,
        "starting_happiness": max(0, min(100, country.starting_happiness)),
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


class BuildCastlePayload(BaseModel):
    country_id: str
    level: int  # 1, 2, or 3

@router.post("/castle/build")
async def build_castle(payload: BuildCastlePayload, state: OrchestratorState = Depends(get_state)):
    """Queues a castle construction intervention."""
    is_active = payload.country_id in state.active_miners
    is_pending_add = any(i["type"] == "COUNTRY_ADD" and i["target"] == payload.country_id for i in state.pending_interventions)
    is_pending_remove = any(i["type"] == "COUNTRY_REMOVE" and i["target"] == payload.country_id for i in state.pending_interventions)

    if (not is_active and not is_pending_add) or is_pending_remove:
        raise HTTPException(status_code=400, detail=f"Cannot build castle in '{payload.country_id}': Country does not exist or is pending removal.")

    if payload.level not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="Castle level must be 1, 2, or 3.")

    cost = state.game_parameters.castles[payload.level].build_cost

    current_gold = state.gold_ledger.get(payload.country_id, 0)
    pending_cost = 0
    for i in state.pending_interventions:
        if i["type"] == "BUILD_CASTLE" and i["target"] == payload.country_id:
            pending_cost += state.game_parameters.castles[i["level"]].build_cost

    if current_gold < cost + pending_cost:
        raise HTTPException(
            status_code=400, 
            detail=f"Country '{payload.country_id}' does not have enough gold ({current_gold} < {cost + pending_cost}) to build this castle."
        )

    await state.add_pending_intervention({
        "type": "BUILD_CASTLE",
        "target": payload.country_id,
        "level": payload.level
    })
    return {"message": "Castle construction queued."}


class DemolishCastlePayload(BaseModel):
    country_id: str
    level: int  # 1, 2, or 3

@router.post("/castle/demolish")
async def demolish_castle(payload: DemolishCastlePayload, state: OrchestratorState = Depends(get_state)):
    """Queues a castle demolition intervention."""
    is_active = payload.country_id in state.active_miners
    is_pending_add = any(i["type"] == "COUNTRY_ADD" and i["target"] == payload.country_id for i in state.pending_interventions)
    is_pending_remove = any(i["type"] == "COUNTRY_REMOVE" and i["target"] == payload.country_id for i in state.pending_interventions)

    if (not is_active and not is_pending_add) or is_pending_remove:
        raise HTTPException(status_code=400, detail=f"Cannot demolish castle in '{payload.country_id}': Country does not exist or is pending removal.")

    if payload.level not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="Castle level must be 1, 2, or 3.")

    current_castles = list(state.castle_ledger.get(payload.country_id, []))
    for i in state.pending_interventions:
        if i["target"] == payload.country_id:
            if i["type"] == "BUILD_CASTLE":
                current_castles.append(i["level"])
            elif i["type"] == "DEMOLISH_CASTLE":
                if i["level"] in current_castles:
                    current_castles.remove(i["level"])

    if payload.level not in current_castles:
        raise HTTPException(
            status_code=400, 
            detail=f"Country '{payload.country_id}' does not have a Level {payload.level} Castle to demolish."
        )

    await state.add_pending_intervention({
        "type": "DEMOLISH_CASTLE",
        "target": payload.country_id,
        "level": payload.level
    })
    return {"message": "Castle demolition queued."}


class SetTaxRatePayload(BaseModel):
    country_id: str
    tax_rate: float  # 0.0 – 1.0  (0 % – 100 %)

@router.post("/tax/set")
async def set_tax_rate(payload: SetTaxRatePayload, state: OrchestratorState = Depends(get_state)):
    """Queues a per-country tax rate change (0.0 = 0%, 1.0 = 100%).
    Mined into the blockchain on next commit; applies to gold income from population.
    """
    is_active = payload.country_id in state.active_miners
    is_pending_add = any(
        i["type"] == "COUNTRY_ADD" and i["target"] == payload.country_id
        for i in state.pending_interventions
    )
    is_pending_remove = any(
        i["type"] == "COUNTRY_REMOVE" and i["target"] == payload.country_id
        for i in state.pending_interventions
    )
    if (not is_active and not is_pending_add) or is_pending_remove:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot set tax rate for '{payload.country_id}': country does not exist.",
        )

    rate = max(0.0, min(2.0, payload.tax_rate))

    # Replace any pending tax rate change for this country
    state.pending_interventions[:] = [
        i for i in state.pending_interventions
        if not (i["type"] == "SET_TAX_RATE" and i["target"] == payload.country_id)
    ]

    old_rate_stored = float(state.tax_ledger.get(payload.country_id, 1.0))

    await state.add_pending_intervention({
        "type": "SET_TAX_RATE",
        "target": payload.country_id,
        "tax_rate": rate,
        "old_tax_rate": old_rate_stored,
    })
    return {"message": f"Tax rate for {payload.country_id} set to {rate:.0%}. Will apply on next commit."}


@router.post("/rival/add")
async def add_rival(payload: RivalPayload, state: OrchestratorState = Depends(get_state)):
    """Queues a rival addition for a country."""
    if payload.country_id == payload.rival_id:
        raise HTTPException(status_code=400, detail="A country cannot rival itself.")

    if not country_exists(state, payload.country_id):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add rival for '{payload.country_id}': country does not exist or is pending removal.",
        )

    if not country_exists(state, payload.rival_id):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add '{payload.rival_id}' as rival: country does not exist or is pending removal.",
        )

    if payload.rival_id in effective_rivals(state, payload.country_id):
        raise HTTPException(
            status_code=400,
            detail=f"'{payload.rival_id}' is already a rival of '{payload.country_id}'.",
        )

    await state.add_pending_intervention({
        "type": "ADD_RIVAL",
        "target": payload.country_id,
        "rival_id": payload.rival_id,
    })
    return {"message": "Rival addition queued."}


@router.post("/rival/remove")
async def remove_rival(payload: RivalPayload, state: OrchestratorState = Depends(get_state)):
    """Queues a rival removal for a country."""
    if payload.country_id == payload.rival_id:
        raise HTTPException(status_code=400, detail="A country cannot rival itself.")

    if not country_exists(state, payload.country_id):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot remove rival for '{payload.country_id}': country does not exist or is pending removal.",
        )

    if not country_exists(state, payload.rival_id):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot remove '{payload.rival_id}' as rival: country does not exist or is pending removal.",
        )

    if payload.rival_id not in effective_rivals(state, payload.country_id):
        raise HTTPException(
            status_code=400,
            detail=f"'{payload.rival_id}' is not a rival of '{payload.country_id}'.",
        )

    await state.add_pending_intervention({
        "type": "REMOVE_RIVAL",
        "target": payload.country_id,
        "rival_id": payload.rival_id,
    })
    return {"message": "Rival removal queued."}


@router.delete("/pending/{index}")
async def remove_pending(index: int, state: OrchestratorState = Depends(get_state)):
    """Removes a pending intervention by index."""
    await state.remove_pending_intervention(index)
    return {"message": "Intervention removed."}

@router.post("/commit")
async def commit_interventions(state: OrchestratorState = Depends(get_state)):
    """Starts the simulation pipeline with all queued interventions."""
    return await state.start_simulation_pipeline()
