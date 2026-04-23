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
        self.action_winner: Optional[str] = None
        self.alliance_winner: Optional[str] = None
        self.current_reward: int = 0
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
            "chain_length": len(self.chain),
            "action_winner": self.action_winner,
            "alliance_winner": self.alliance_winner,
            "current_reward": self.current_reward
        }

    async def broadcast(self):
        await self.manager.broadcast_state(self.get_state_data(), self.id)

    async def start_simulation_pipeline(self, mempool_type: str, target: str, extra_data: Dict = None):
        """Standardized 4-step pipeline initiator"""
        if self.step != 0:
            raise HTTPException(status_code=400, detail=f"Pipeline is currently at step {self.step}. Wait for equilibrium.")
        
        self.action_winner = None
        self.alliance_winner = None
        self.current_reward = 0
        
        # Step 1: Action Mempool Generation
        self.step = 1
        mempool = {
            "type": f"{mempool_type} + REWARD",
            "target": target,
            "phase": PipelinePhase.PHASE_1_INITIAL
        }
        if extra_data:
            mempool.update(extra_data)
            
        self.current_mempool = mempool
        self.reset_submissions()
        print(f"[DEBUG] Pipeline Started: {mempool_type} for {target}. Step 1 Active.")
        await self.broadcast()

    def reset_submissions(self):
        self.block_submissions = {}

    def append_block_to_chain(self, block_hash: str, miner: str = None, reward: int = 0):
        """Simulates adding the block formally to the chain metadata via the dummy hash"""
        self.latest_block = Block(
            index=self.latest_block.index + 1, 
            previous_hash=self.latest_block.hash, 
            mempool=self.current_mempool or {},
            nonce=0,
            miner=miner,
            reward=reward
        )
        self.latest_block.hash = block_hash # hard setting the consensus hash
        self.chain.append(self.latest_block)

    async def handle_consensus_reached(self, phase: PipelinePhase, block_hash: str):
        """Advances the pipeline when a phase achieves consensus."""
        print(f"[DEBUG] Handling Consensus for phase: {phase}")
        
        # Identify the winner for this block
        winner = None
        reward = 0
        for m, h in self.block_submissions.items():
            if h == block_hash:
                winner = m
                reward = 1000
                break
        
        if int(phase) == int(PipelinePhase.PHASE_1_INITIAL):
            self.action_winner = winner
        elif int(phase) == int(PipelinePhase.PHASE_3_EXECUTION):
            self.alliance_winner = winner
            
        self.current_reward = reward
        self.append_block_to_chain(block_hash, miner=winner, reward=reward)
        
        # Apply reward to ledger
        if winner:
            self.troop_ledger[winner] = self.troop_ledger.get(winner, 0) + reward
            
        mempool = self.current_mempool or {}
        m_type = mempool.get("type")
        m_target = mempool.get("target")

        if int(phase) == int(PipelinePhase.PHASE_1_INITIAL):
            # Step 2: Action Consensus Reached & Applied
            self.step = 2
            
            # 1. APPLY INITIAL STATE CHANGES
            if "GOD_INTERVENTION" in m_type:
                change = mempool.get("change", 0)
                self.troop_ledger[m_target] = max(0, self.troop_ledger.get(m_target, 0) + change)
            elif "COUNTRY_ADD" in m_type:
                if m_target not in self.active_miners:
                    self.active_miners.append(m_target)
                    self.troop_ledger[m_target] = mempool.get("starting_troops", 10000)
            elif "COUNTRY_REMOVE" in m_type:
                if m_target in self.active_miners:
                    self.active_miners.remove(m_target)
                    self.troop_ledger.pop(m_target, None)
                    self.alliances = [a for a in self.alliances if m_target not in a]

            # 2. SOLVER TRIGGER & TRANSITION TO STEP 3
            self.step = 3
            print("[DEBUG] Invoking PuLP Solver...")
            predicted_alliances = calculate_alliances(self.troop_ledger)

            self.current_mempool = {
                **mempool,
                "type": "ALLIANCE_UPDATE + REWARD",
                "data": {"new_alliances": predicted_alliances}, 
                "phase": PipelinePhase.PHASE_3_EXECUTION
            }
            self.reset_submissions()
            await self.broadcast()
            return {"message": "Action Consensus (Step 2) reached. Proceeding to Alliance Phase (Step 3).", "step": self.step}
            
        elif int(phase) == int(PipelinePhase.PHASE_3_EXECUTION):
            # Step 4: Alliance Consensus Reached & Finalized
            self.step = 4
            if mempool.get("data") and "new_alliances" in mempool["data"]:
                self.alliances = mempool["data"]["new_alliances"]

            await self.broadcast()
            
            # Reset to Equilibrium after a short delay for UX
            time.sleep(1.5)
            self.step = 0
            self.current_mempool = None
            self.reset_submissions()
            await self.broadcast()
            print("[DEBUG] PIPELINE COMPLETE. Step 4 finalized.")
            return {"message": "Alliance Consensus reached. Simulation at Equilibrium.", "step": self.step}
