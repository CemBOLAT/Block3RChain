import time
from typing import Dict, List, Optional
from fastapi import HTTPException
from engine.solver import calculate_alliances
from emulator.core import create_genesis_block, Block
from .schemas import PipelinePhase
from .websocket import ConnectionManager

class OrchestratorState:
    def __init__(self, simulation_id: str, manager: ConnectionManager):
        self.id = simulation_id
        self.manager = manager
        # step = 0 -> Equilibrium. 1-15 correspond to pipeline steps.
        self.step: int = 0
        self.is_initialized: bool = False
        
        # No active countries at start
        self.active_miners: List[str] = []
        
        # Empty ledger and alliances
        self.troop_ledger: Dict[str, int] = {}
        self.alliances: List[str] = []
        
        # --- BLOCKCHAIN HEADERS ---
        self.latest_block: Optional[Block] = None
        self.chain: List[Block] = []
        
        # Pipeline execution variables
        self.current_mempool: Optional[Dict] = None
        self.block_submissions: Dict[str, str] = {}  # Tracks country_id -> block_hash

    def initialize(self, nations: Dict[str, int]):
        """Initializes the simulation with a specific nation configuration."""
        self.troop_ledger = nations
        self.active_miners = list(nations.keys())
        self.latest_block = create_genesis_block(self.troop_ledger)
        self.chain = [self.latest_block]
        self.is_initialized = True

    def get_state_data(self):
        return {
            "simulation_id": self.id,
            "step": self.step,
            "is_initialized": self.is_initialized,
            "ledger": self.troop_ledger,
            "alliances": self.alliances,
            "mempool": self.current_mempool,
            "latest_block_hash": self.latest_block.hash if self.latest_block else None,
            "chain_length": len(self.chain)
        }

    async def broadcast(self):
        await self.manager.broadcast_state(self.get_state_data(), self.id)

    async def start_simulation_pipeline(self, mempool_type: str, target: str, extra_data: Dict = None):
        """Standardized 15-step pipeline initiator for anything requiring Consensus (Troops, Add/Remove Country)"""
        if self.step != 0:
            raise HTTPException(status_code=400, detail=f"Pipeline is currently at step {self.step}. Wait for equilibrium.")
        
        # Pipeline Step 2: API registers and broadcasts
        self.step = 2 
        await self.broadcast()
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
        await self.broadcast()

    def reset_submissions(self):
        self.block_submissions = {}

    def append_block_to_chain(self, block_hash: str):
        """Simulates adding the block formally to the chain metadata via the dummy hash"""
        self.latest_block = Block(
            index=self.latest_block.index + 1, 
            previous_hash=self.latest_block.hash, 
            mempool=self.current_mempool or {},
            nonce=0
        )
        self.latest_block.hash = block_hash # hard setting the consensus hash
        self.chain.append(self.latest_block)

    async def handle_consensus_reached(self, phase: PipelinePhase, block_hash: str):
        """Advances the pipeline when a phase achieves consensus."""
        print(f"[DEBUG] Handling Consensus for phase: {phase}")
        self.append_block_to_chain(block_hash)
        mempool = self.current_mempool or {}
        m_type = mempool.get("type")
        m_target = mempool.get("target")

        if int(phase) == int(PipelinePhase.PHASE_1_INITIAL):
            self.step = 5
            await self.broadcast()
            
            # APPLY INITIAL STATE CHANGES
            if m_type == "GOD_INTERVENTION":
                change = mempool.get("change", 0)
                self.troop_ledger[m_target] = max(0, self.troop_ledger.get(m_target, 0) + change)
            elif m_type == "COUNTRY_ADD":
                if m_target not in self.active_miners:
                    self.active_miners.append(m_target)
                    self.troop_ledger[m_target] = mempool.get("starting_troops", 10000)
            elif m_type == "COUNTRY_REMOVE":
                if m_target in self.active_miners:
                    self.active_miners.remove(m_target)
                    self.troop_ledger.pop(m_target, None)
                    self.alliances = [a for a in self.alliances if m_target not in a]

            # Step 6: Block Reward
            winner = list(self.block_submissions.keys())[0]
            self.troop_ledger[winner] += 1000 
            
            # Transition to Phase 2
            self.step = 7
            self.current_mempool = {**mempool, "phase": PipelinePhase.PHASE_2_STABILIZATION}
            self.reset_submissions()
            await self.broadcast()
            return {"message": "Phase 1 consensus verified. Proceeding to Phase 2.", "step": self.step}
            
        elif int(phase) == int(PipelinePhase.PHASE_2_STABILIZATION):
            self.step = 9
            await self.broadcast()
            
            # Step 10 & 11: Solver Call
            self.step = 11
            await self.broadcast()
            
            print("[DEBUG] Invoking PuLP Solver...")
            predicted_alliances = calculate_alliances(self.troop_ledger)
            
            # Transition to Phase 3
            self.step = 12
            self.current_mempool = {
                **mempool,
                "data": {"new_alliances": predicted_alliances}, 
                "phase": PipelinePhase.PHASE_3_EXECUTION
            }
            self.reset_submissions()
            await self.broadcast()
            return {"message": "Phase 2 consensus verified. Solver Invoked. Proceeding to Phase 3.", "step": self.step}
            
        elif int(phase) == int(PipelinePhase.PHASE_3_EXECUTION):
            self.step = 14
            await self.broadcast()
            
            # FINAL APPLY & CLEANUP
            self.step = 15
            if mempool.get("data") and "new_alliances" in mempool["data"]:
                self.alliances = mempool["data"]["new_alliances"]

            # Reset to Equilibrium
            self.step = 0
            self.current_mempool = None
            self.reset_submissions()
            await self.broadcast()
            print("[DEBUG] PIPELINE COMPLETE. Equilibrium Restored.")
            return {"message": "Phase 3 consensus verified. Changes finalized. System at Equilibrium.", "step": self.step}
