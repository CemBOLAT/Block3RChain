from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from enum import IntEnum
import time

from engine.solver import calculate_alliances
from emulator.core import create_genesis_block, Block
from api.database import init_db, get_session, SimulationTemplate, SimulationTemplateRead
from sqlmodel import select, Session
from fastapi import Depends

app = FastAPI(title="Block3RChain God-Mode Orchestrator")

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

# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_state(self):
        state_data = {
            "step": state.step,
            "ledger": state.troop_ledger,
            "alliances": state.alliances,
            "mempool": state.current_mempool,
            "latest_block_hash": state.latest_block.hash,
            "chain_length": len(state.chain)
        }
        for connection in self.active_connections:
            try:
                await connection.send_json(state_data)
            except Exception as e:
                pass

manager = ConnectionManager()

# --- ENUMS ---
class PipelinePhase(IntEnum):
    PHASE_1_INITIAL = 1
    PHASE_2_STABILIZATION = 2
    PHASE_3_EXECUTION = 3

# --- DATA MODELS ---
class GodIntervention(BaseModel):
    country_id: str
    troop_change: int  # Example: +5000 or -2000 troops

class BlockSubmission(BaseModel):
    country_id: str
    block_hash: str
    phase: PipelinePhase  # Replaced int with PipelinePhase Enum

class CountryAdd(BaseModel):
    country_id: str
    starting_troops: int = 10000

class CountryRemove(BaseModel):
    country_id: str

# --- SIMULATION STATE ---
class OrchestratorState:
    def __init__(self):
        # step = 0 -> Equilibrium. 1-15 correspond to pipeline steps.
        self.step: int = 0
        
        # 6 Active Countries initialized at the start
        self.active_miners: List[str] = [
            "Turkey", 
            "Greece", 
            "Bulgaria", 
            "Serbia", 
            "Romania",
            "Hungary"
        ]
        
        # Core Blockchain State (Ledger) - each gets a starting balance
        self.troop_ledger: Dict[str, int] = {country: 10000 for country in self.active_miners}
        
        self.alliances: List[str] = []
        
        # --- BLOCKCHAIN HEADERS ---
        # The Genesis block serves as the initial starting point 
        self.latest_block: Block = create_genesis_block(self.troop_ledger)
        self.chain: List[Block] = [self.latest_block]
        
        # Pipeline execution variables
        self.current_mempool: Optional[Dict] = None
        self.block_submissions: Dict[str, str] = {}  # Tracks country_id -> block_hash

    async def start_simulation_pipeline(self, mempool_type: str, target: str, extra_data: Dict = None):
        """Standardized 15-step pipeline initiator for anything requiring Consensus (Troops, Add/Remove Country)"""
        if self.step != 0:
            raise HTTPException(status_code=400, detail=f"Pipeline is currently at step {self.step}. Wait for equilibrium.")
        
        # Pipeline Step 2: API registers and broadcasts
        self.step = 2 
        await manager.broadcast_state()
        time.sleep(1) # Visual pacing
        
        # Pipeline Step 3: Mempool generation for Phase 1
        self.step = 3
        mempool = {
            "type": mempool_type,
            "target": target,
            "phase": PipelinePhase.PHASE_1_INITIAL
        }
        if extra_data:
            mempool.update(extra_data)
            
        self.current_mempool = mempool
        self.reset_submissions()
        print(f"[DEBUG] Pipeline Started: {mempool_type} for {target}. Phase 1 active.")
        await manager.broadcast_state()

    def reset_submissions(self):
        self.block_submissions = {}

    def append_block_to_chain(self, block_hash: str):
        """Simulates adding the block formally to the chain metadata via the dummy hash"""
        # Note: True block object isn't fully reconstructible here by orchestrator alone
        # in a real setup without the Node's nonce, but for API sim we mark the string hash
        self.latest_block = Block(
            index=self.latest_block.index + 1, 
            previous_hash=self.latest_block.hash, 
            mempool=self.current_mempool or {},
            nonce=0
        )
        self.latest_block.hash = block_hash # hard setting the consensus hash
        self.chain.append(self.latest_block)

state = OrchestratorState()

# --- ENDPOINTS ---

@app.websocket("/ws/state")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await manager.broadcast_state()
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {
        "message": "Block3RChain Orchestrator is running", 
        "current_step": state.step,
        "status": "EQUILIBRIUM" if state.step == 0 else "PROCESSING_PIPELINE"
    }

@app.get("/api/state")
def get_state():
    """Frontend will poll this (or use WebSockets later) to render the D3 map."""
    return {
        "step": state.step,
        "ledger": state.troop_ledger,
        "alliances": state.alliances,
        "mempool": state.current_mempool,
        "latest_block_hash": state.latest_block.hash,
        "chain_length": len(state.chain)
    }

@app.get("/api/simulation-templates", response_model=List[SimulationTemplateRead])
def get_simulation_templates(session: Session = Depends(get_session)):
    """Fetch all available simulation templates from the database."""
    templates = session.exec(select(SimulationTemplate)).all()
    return templates

@app.get("/api/mempool")
def get_mempool():
    """Miners poll this to fetch the mempool and the Previous Block Hash to solve the correct block."""
    return {
        "mempool": state.current_mempool,
        "previous_hash": state.latest_block.hash,
        "index_to_mine": state.latest_block.index + 1
    }

@app.post("/api/god/intervention")
async def god_intervention(intervention: GodIntervention):
    """Triggers Phase 1 of the 15-step pipeline for troop adjustments."""
    print(f"[DEBUG] God Intervention API Hit: {intervention}")
    return await state.start_simulation_pipeline(
        mempool_type="GOD_INTERVENTION", 
        target=intervention.country_id, 
        extra_data={"change": intervention.troop_change}
    )

@app.post("/api/god/country/add")
async def add_country(country: CountryAdd):
    """Proposes adding a new country via consensus."""
    if country.country_id in state.active_miners:
        raise HTTPException(status_code=400, detail="Country already exists.")
    
    return await state.start_simulation_pipeline(
        mempool_type="COUNTRY_ADD",
        target=country.country_id,
        extra_data={"starting_troops": country.starting_troops}
    )

@app.post("/api/god/country/remove")
async def remove_country(country: CountryRemove):
    """Proposes removing a country via consensus."""
    if country.country_id not in state.active_miners:
        raise HTTPException(status_code=404, detail="Country not found.")
    
    return await state.start_simulation_pipeline(
        mempool_type="COUNTRY_REMOVE",
        target=country.country_id
    )

@app.post("/api/miner/submit")
async def submit_block(sub: BlockSubmission):
    """Miners hit this endpoint when they solve the Hash (Steps 4, 8, 13)"""
    print(f"[DEBUG] Block submission received from {sub.country_id}. Phase: {sub.phase}")
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
    await manager.broadcast_state()
    
    # GERÇEK AĞ (BLOCKCHAIN) SİMÜLASYONU: 
    # İlk çözen (miner) block'u gossip ile diğerlerine iletir.
    # Tüm node'lar (toplam 5 ülke) bloğu onaylayıp gönderdiğinde Consensus gerçekleşir.
    if len(state.block_submissions) == len(state.active_miners):
        hashes = list(state.block_submissions.values())
        if all(h == hashes[0] for h in hashes):
            print(f"[DEBUG] UNIVERSAL CONSENSUS REACHED for Phase {expected_phase}!")
            # Universal Consensus Reached!
            return await handle_consensus_reached(sub.phase, hashes[0])
        else:
            print("[DEBUG] CONSENSUS FAILURE! Hashes did not match!")
            raise HTTPException(status_code=409, detail="Consensus failure. Fork detected after miner gossip.")
            
    return {"message": f"Block accepted. Waiting for {len(state.active_miners) - len(state.block_submissions)} more miners."}

async def handle_consensus_reached(phase: PipelinePhase, block_hash: str):
    """Advances the pipeline when a phase achieves consensus."""
    print(f"[DEBUG] Handling Consensus for phase: {phase}")
    state.append_block_to_chain(block_hash)
    mempool = state.current_mempool or {}
    m_type = mempool.get("type")
    m_target = mempool.get("target")

    if int(phase) == int(PipelinePhase.PHASE_1_INITIAL):
        state.step = 5
        await manager.broadcast_state()
        
        # APPLY INITIAL STATE CHANGES
        if m_type == "GOD_INTERVENTION":
            change = mempool.get("change", 0)
            state.troop_ledger[m_target] = max(0, state.troop_ledger.get(m_target, 0) + change)
        elif m_type == "COUNTRY_ADD":
            # Formal entry into ledger at the end of Phase 1
            # This allows the country to spin up its miner node for Phase 2/3
            if m_target not in state.active_miners:
                state.active_miners.append(m_target)
                state.troop_ledger[m_target] = mempool.get("starting_troops", 10000)
        elif m_type == "COUNTRY_REMOVE":
            # We don't remove yet, just keep going through the pipeline to finalize alliances
            pass

        # Step 6: Block Reward
        winner = list(state.block_submissions.keys())[0]
        state.troop_ledger[winner] += 1000 
        
        # Transition to Phase 2
        state.step = 7
        state.current_mempool = {**mempool, "phase": PipelinePhase.PHASE_2_STABILIZATION}
        state.reset_submissions()
        await manager.broadcast_state()
        return {"message": "Phase 1 consensus verified. Proceeding to Phase 2.", "step": state.step}
        
    elif int(phase) == int(PipelinePhase.PHASE_2_STABILIZATION):
        state.step = 9
        await manager.broadcast_state()
        
        # Step 10 & 11: Solver Call
        state.step = 11
        await manager.broadcast_state()
        
        print("[DEBUG] Invoking PuLP Solver...")
        predicted_alliances = calculate_alliances(state.troop_ledger)
        
        # Transition to Phase 3
        state.step = 12
        state.current_mempool = {
            **mempool,
            "data": {"new_alliances": predicted_alliances}, 
            "phase": PipelinePhase.PHASE_3_EXECUTION
        }
        state.reset_submissions()
        await manager.broadcast_state()
        return {"message": "Phase 2 consensus verified. Solver Invoked. Proceeding to Phase 3.", "step": state.step}
        
    elif int(phase) == int(PipelinePhase.PHASE_3_EXECUTION):
        state.step = 14
        await manager.broadcast_state()
        
        # FINAL APPLY & CLEANUP
        state.step = 15
        if mempool.get("data") and "new_alliances" in mempool["data"]:
            state.alliances = mempool["data"]["new_alliances"]
            
        if m_type == "COUNTRY_REMOVE":
            # Final removal after all consensus phases and final alliance calculation
            if m_target in state.active_miners:
                state.active_miners.remove(m_target)
                state.troop_ledger.pop(m_target, None)
                state.alliances = [a for a in state.alliances if m_target not in a]

        # Reset to Equilibrium
        state.step = 0
        state.current_mempool = None
        state.reset_submissions()
        await manager.broadcast_state()
        print("[DEBUG] PIPELINE COMPLETE. Equilibrium Restored.")
        return {"message": "Phase 3 consensus verified. Changes finalized. System at Equilibrium.", "step": state.step}
