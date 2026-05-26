from fastapi import APIRouter, HTTPException, Depends
from ..schemas import BlockSubmission
from ..dependencies import get_state, OrchestratorState

router = APIRouter(prefix="/api/simulation/{simulation_id}", tags=["Miner"])

@router.get("/mempool")
def get_mempool(state: OrchestratorState = Depends(get_state)):
    """Miners poll this to fetch the mempool and the Previous Block Hash to solve the correct block."""
    return {
        "mempool": state.current_mempool,
        "previous_hash": state.latest_block.hash if state.latest_block else None,
        "index_to_mine": (state.latest_block.index + 1) if state.latest_block else 0,
        "current_troop_ledger": state.troop_ledger,
        "current_gold_ledger": state.gold_ledger,
        "current_pop_ledger": state.pop_ledger,
        "current_castle_ledger": state.castle_ledger,
        "current_tax_ledger": state.tax_ledger,
        "current_happiness_ledger": state.happiness_ledger,
        "current_rival_ledger": state.rival_ledger,
        "current_alliances": state.alliances,
        "alliance_parameters": state.alliance_parameters.model_dump(),
        "game_parameters": state.game_parameters.model_dump(),
    }

@router.post("/miner/submit")
async def submit_block(sub: BlockSubmission, state: OrchestratorState = Depends(get_state)):
    print(f"[DEBUG] [Sim {state.id}] Block submission received from {sub.country_id}. Phase: {sub.phase}")
    if sub.country_id not in state.active_miners:
        raise HTTPException(status_code=403, detail="Unauthorized miner.")
        
    # First valid block wins for the current mempool (production: phase 1 only).
    if state.action_winner:
        return {"message": "Mining already completed for this round. Block rejected."}

    expected_phase = state.current_mempool.get("phase") if state.current_mempool else None
    
    # Type tolerance check: sub.phase comes in as Enum or Int
    if expected_phase is None or int(sub.phase) != int(expected_phase):
        print(f"[DEBUG] Rejecting! Expected Phase {expected_phase}, Got Phase {sub.phase}")
        raise HTTPException(status_code=400, detail=f"Expected block for phase {expected_phase}, got {sub.phase}.")

    state.action_winner = sub.country_id

    # Record the submission for logging
    state.block_submissions[sub.country_id] = sub.block_hash
    print(f"[GATEWAY] Winner Found! {sub.country_id} submitted first for Phase {expected_phase} with reward claim {sub.reward_claimed}.")
    
    return await state.handle_consensus_reached(
        sub.phase,
        sub.country_id,
        sub.block_hash,
        sub.reward_claimed,
        sub.updated_ledger,
        sub.nonce,
        sub.predicted_alliances,
        sub.alliance_ledger_updates,
        updated_gold_ledger=sub.updated_gold_ledger,
        updated_pop_ledger=sub.updated_pop_ledger,
        updated_castle_ledger=sub.updated_castle_ledger,
        updated_tax_ledger=sub.updated_tax_ledger,
        updated_happiness_ledger=sub.updated_happiness_ledger,
        updated_rival_ledger=sub.updated_rival_ledger,
        economic_deaths=sub.economic_deaths,
        unhappy_emigration=sub.unhappy_emigration,
        gold_ledger_updates=sub.gold_ledger_updates,
        pop_ledger_updates=sub.pop_ledger_updates,
        castle_ledger_updates=sub.castle_ledger_updates,
        happiness_ledger_updates=sub.happiness_ledger_updates,
        alliance_stability_score=sub.alliance_stability_score,
        alliance_status=sub.alliance_status,
    )
    

