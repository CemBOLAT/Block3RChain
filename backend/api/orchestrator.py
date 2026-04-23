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
        self.acknowledgements: Set[str] = set()  # Track which nodes are synced
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
        """Standardized 4-step pipeline initiator. Now acts as a bridge only."""
        if self.step != 0:
            raise HTTPException(status_code=400, detail=f"Pipeline is currently at step {self.step}. Wait for equilibrium.")
        
        self.action_winner = None
        self.alliance_winner = None
        
        # Gateway defines the baseline reward that nodes SHOULD include for themselves
        self.current_reward = 1000 
        
        # Step 1: Action Mempool Generation (Bridge Mode)
        self.step = 1
        mempool = {
            "type": mempool_type,
            "target": target,
            "phase": PipelinePhase.PHASE_1_INITIAL,
            "base_reward": self.current_reward
        }
        if extra_data:
            mempool.update(extra_data)
            
        self.current_mempool = mempool
        self.reset_submissions()
        print(f"[GATEWAY] Bridge mode: Broadcasting {mempool_type} request to nodes. Step 1 Active.")
        await self.broadcast()

    def reset_submissions(self):
        self.block_submissions = {}

    def append_block_to_chain(self, block_hash: str, miner: str = None, reward: int = 0, nonce: int = 0):
        """Simulates adding the block formally to the chain metadata via the dummy hash"""
        self.latest_block = Block(
            index=self.latest_block.index + 1, 
            previous_hash=self.latest_block.hash, 
            mempool=self.current_mempool or {},
            nonce=nonce,
            miner=miner,
            reward=reward
        )
        self.latest_block.hash = block_hash # hard setting the consensus hash
        self.chain.append(self.latest_block)

    async def handle_consensus_reached(self, phase: PipelinePhase, winner: str, block_hash: str, reward_claimed: int, updated_ledger: Dict, nonce: int):
        """Advances the pipeline as soon as the FIRST valid block is submitted."""
        print(f"[GATEWAY] Consensus Reached! Winner: {winner} for phase {phase}. Claimed Reward: {reward_claimed}. Nonce: {nonce}")
        
        if int(phase) == int(PipelinePhase.PHASE_1_INITIAL):
            self.action_winner = winner
        elif int(phase) == int(PipelinePhase.PHASE_3_EXECUTION):
            self.alliance_winner = winner
            
        self.current_reward = reward_claimed
        
        # GATEWAY AS A PURE RELAY: Accepts the new state from the winning node completely.
        self.troop_ledger = updated_ledger
        
        if int(phase) == int(PipelinePhase.PHASE_1_INITIAL):
            # Step 2: Transition to Synchronization Phase BEFORE appending block to avoid race condition
            self.step = 2
            self.acknowledgements = set() # Reset for this block
            print(f"[GATEWAY] Preparing for Synchronization Phase (Step 2)...")

        self.append_block_to_chain(block_hash, miner=winner, reward=reward_claimed, nonce=nonce)
        
        mempool = self.current_mempool or {}

        if int(phase) == int(PipelinePhase.PHASE_1_INITIAL):
            print(f"[GATEWAY] Block index {self.latest_block.index} accepted. Waiting for network synchronization.")
            await self.broadcast()
            return {"message": "Block found. Waiting for network synchronization.", "step": self.step}

        elif int(phase) == int(PipelinePhase.PHASE_3_EXECUTION):
            # Step 4: Alliance Consensus Reached & Finalized
            self.step = 4
            if mempool.get("data") and "new_alliances" in mempool["data"]:
                self.alliances = mempool["data"]["new_alliances"]

            await self.broadcast()
            
            # Reset to Equilibrium after a short delay for UX
            self.step = 0
            self.current_mempool = None
            self.reset_submissions()
            await self.broadcast()
            print("[DEBUG] PIPELINE COMPLETE. Step 4 finalized.")
            return {"message": "Alliance Consensus reached. Simulation at Equilibrium.", "step": self.step}

    async def acknowledge_block(self, country_id: str):
        """Called by nodes to confirm they have received and applied the latest block."""
        if self.step != 2:
            return {"message": "Not in synchronization phase."}
            
        self.acknowledgements.add(country_id)
        print(f"[GATEWAY] Node {country_id} acknowledged block. ({len(self.acknowledgements)}/{len(self.active_miners)})")
        
        if len(self.acknowledgements) >= len(self.active_miners):
            await self.proceed_to_alliance_phase()
            
    async def proceed_to_alliance_phase(self):
        """Triggered once all nodes are synchronized."""
        print("[GATEWAY] Network synchronized! Invoking PuLP Solver...")
        self.step = 3
        
        mempool = self.current_mempool or {}
        m_type = mempool.get("type", "")
        m_target = mempool.get("target")
        
        if "COUNTRY_ADD" in m_type and m_target not in self.active_miners:
            self.active_miners.append(m_target)
        elif "COUNTRY_REMOVE" in m_type and m_target in self.active_miners:
            self.active_miners.remove(m_target)
            self.alliances = [a for a in self.alliances if m_target not in a]

        try:
            predicted_alliances = calculate_alliances(self.troop_ledger)
        except Exception as e:
            print(f"[ERROR] Alliance calculation failed: {e}")
            predicted_alliances = []
            
        self.current_mempool = {
            "type": "ALLIANCE_UPDATE",
            "target": "GLOBAL",
            "data": {"new_alliances": predicted_alliances}, 
            "phase": PipelinePhase.PHASE_3_EXECUTION,
            "index": len(self.chain),
            "index_to_mine": len(self.chain),
            "base_reward": self.current_reward
        }
        self.reset_submissions()
        await self.broadcast()

    async def check_synchronization(self):
        """Helper to check if all nodes have acknowledged."""
        return len(self.acknowledgements) >= len(self.active_miners)
