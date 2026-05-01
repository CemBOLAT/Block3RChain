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
        "current_ledger": state.troop_ledger,
        "current_gold_ledger": state.gold_ledger,
        "current_pop_ledger": state.pop_ledger,
        "current_alliances": state.alliances
    }

@router.post("/miner/submit")
async def submit_block(sub: BlockSubmission, state: OrchestratorState = Depends(get_state)):
    """Miners hit this endpoint when they solve the Hash (Steps 4, 8, 13)"""
    print(f"[DEBUG] [Sim {state.id}] Block submission received from {sub.country_id}. Phase: {sub.phase}")
    if sub.country_id not in state.active_miners:
        raise HTTPException(status_code=403, detail="Unauthorized miner.")
        
    expected_phase = state.current_mempool.get("phase") if state.current_mempool else None
    
    # Type tolerance check: sub.phase comes in as Enum or Int
    if expected_phase is None or int(sub.phase) != int(expected_phase):
        print(f"[DEBUG] Rejecting! Expected Phase {expected_phase}, Got Phase {sub.phase}")
        raise HTTPException(status_code=400, detail=f"Expected block for phase {expected_phase}, got {sub.phase}.")

    # FIRST-TO-MINE LOGIC: Check if this phase is already completed
    if (int(sub.phase) == 1 and state.action_winner) or (int(sub.phase) == 3 and state.alliance_winner):
        return {"message": "Mining already completed for this phase. Block rejected."}

    # Atomically lock the phase to prevent concurrent race conditions
    if int(sub.phase) == 1:
        state.action_winner = sub.country_id
    elif int(sub.phase) == 3:
        state.alliance_winner = sub.country_id

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
        economic_deaths=sub.economic_deaths,
        gold_ledger_updates=sub.gold_ledger_updates,
        pop_ledger_updates=sub.pop_ledger_updates
    )
    

