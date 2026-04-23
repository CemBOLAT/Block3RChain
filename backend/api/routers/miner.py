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
        "index_to_mine": (state.latest_block.index + 1) if state.latest_block else 0
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

    # Record the submission
    state.block_submissions[sub.country_id] = sub.block_hash
    print(f"[DEBUG] {len(state.block_submissions)}/{len(state.active_miners)} miners submitted phase {expected_phase}")
    await state.broadcast()
    
    if len(state.block_submissions) == len(state.active_miners):
        hashes = list(state.block_submissions.values())
        if all(h == hashes[0] for h in hashes):
            print(f"[DEBUG] UNIVERSAL CONSENSUS REACHED for Phase {expected_phase}!")
            return await state.handle_consensus_reached(sub.phase, hashes[0])
        else:
            print("[DEBUG] CONSENSUS FAILURE! Hashes did not match!")
            raise HTTPException(status_code=409, detail="Consensus failure. Fork detected after miner gossip.")
            
    return {"message": f"Block accepted. Waiting for {len(state.active_miners) - len(state.block_submissions)} more miners."}
