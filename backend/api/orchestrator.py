import time
import asyncio
from typing import Dict, List, Optional, Set
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
        
        # Empty ledgers and alliances
        self.troop_ledger: Dict[str, int] = {}
        self.gold_ledger: Dict[str, int] = {}
        self.pop_ledger: Dict[str, int] = {}
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
        self.pending_interventions: List[Dict] = []

    def initialize(self, nations: Dict[str, any]):
        """Initializes the simulation with a specific nation configuration."""
        print(f"[GATEWAY] Initializing simulation {self.id} with {len(nations)} nations.")
        for name, data in nations.items():
            # Support both old format (int) and new format (NationData object or dict)
            if isinstance(data, (int, float)):
                self.troop_ledger[name] = int(data)
                self.gold_ledger[name] = 5000
                self.pop_ledger[name] = 10
            elif isinstance(data, dict):
                self.troop_ledger[name] = int(data.get("troops", 1000))
                self.gold_ledger[name] = int(data.get("gold", 5000))
                self.pop_ledger[name] = int(data.get("population", 10))
            else:
                # Likely a Pydantic model
                self.troop_ledger[name] = int(getattr(data, "troops", 1000))
                self.gold_ledger[name] = int(getattr(data, "gold", 5000))
                self.pop_ledger[name] = int(getattr(data, "population", 10))
            
            print(f"  - {name}: {self.troop_ledger[name]} troops, {self.gold_ledger[name]} gold, {self.pop_ledger[name]}M pop")

        self.active_miners = list(nations.keys())
        self.latest_block = create_genesis_block(self.troop_ledger)
        self.chain = [self.latest_block]
        self.is_initialized = True

    def get_state_data(self):
        return {
            "simulation_id": self.id,
            "step": self.step,
            "is_initialized": self.is_initialized,
            "ledger": {k: int(v) for k, v in self.troop_ledger.items()},
            "gold_ledger": {k: int(v) for k, v in self.gold_ledger.items()},
            "pop_ledger": {k: int(v) for k, v in self.pop_ledger.items()},
            "alliances": self.alliances,
            "mempool": self.current_mempool,
            "latest_block_hash": self.latest_block.hash if self.latest_block else None,
            "chain_length": len(self.chain),
            "action_winner": self.action_winner,
            "alliance_winner": self.alliance_winner,
            "current_reward": self.current_reward,
            "pending_interventions": self.pending_interventions
        }

    async def broadcast(self):
        await self.manager.broadcast_state(self.get_state_data(), self.id)

    async def add_pending_intervention(self, intervention: Dict):
        self.pending_interventions.append(intervention)
        await self.broadcast()

    async def remove_pending_intervention(self, index: int):
        if 0 <= index < len(self.pending_interventions):
            self.pending_interventions.pop(index)
            await self.broadcast()

    async def clear_pending_interventions(self):
        self.pending_interventions = []
        await self.broadcast()

    async def start_simulation_pipeline(self):
        """Standardized 4-step pipeline initiator. Now acts as a bridge only."""
        if self.step != 0:
            raise HTTPException(status_code=400, detail=f"Pipeline is currently at step {self.step}. Wait for equilibrium.")
        
        if not self.pending_interventions:
             raise HTTPException(status_code=400, detail="No pending interventions to commit.")

        self.action_winner = None
        self.alliance_winner = None
        
        # Gateway defines the baseline reward that nodes SHOULD include for themselves
        self.current_reward = 1000 
        
        # Step 1: Action Mempool Generation (Bridge Mode)
        self.step = 1
        mempool = {
            "type": "BATCH_INTERVENTIONS",
            "interventions": list(self.pending_interventions), # Copy current pending
            "phase": PipelinePhase.PHASE_1_INITIAL,
            "base_reward": self.current_reward
        }
            
        self.current_mempool = mempool
        self.pending_interventions = [] # Clear pending after starting pipeline
        self.reset_submissions()
        print(f"[GATEWAY] Bridge mode: Broadcasting batch interventions to nodes. Step 1 Active.")
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

    async def handle_consensus_reached(self, phase: PipelinePhase, winner: str, block_hash: str, reward_claimed: int, updated_ledger: Dict, nonce: int, predicted_alliances: List[str] = None, alliance_ledger_updates: Dict[str, int] = None, updated_gold_ledger: Dict = None, updated_pop_ledger: Dict = None, economic_deaths: Dict[str, int] = None):
        """Advances the pipeline as soon as the FIRST valid block is submitted."""
        print(f"[GATEWAY] Consensus Reached! Winner: {winner} for phase {phase}. Claimed Reward: {reward_claimed}. Nonce: {nonce}")
        
        self.action_winner = winner
        self.current_reward = reward_claimed
        
        # GATEWAY AS A PURE RELAY: Accepts the new state from the winning node completely.
        self.troop_ledger = updated_ledger
        if updated_gold_ledger:
            self.gold_ledger = updated_gold_ledger
        if updated_pop_ledger:
            self.pop_ledger = updated_pop_ledger
            
        if predicted_alliances is not None:
            self.alliances = predicted_alliances
            
        mempool = self.current_mempool or {}
        mempool["data"] = {
            "new_alliances": predicted_alliances or [],
            "ledger_updates": alliance_ledger_updates or {},
            "economic_deaths": economic_deaths or {}
        }
        self.current_mempool = mempool
        
        m_type = mempool.get("type", "")
        m_target = mempool.get("target")
        
        if "COUNTRY_REMOVE" in m_type and m_target in self.active_miners:
            print(f"[GATEWAY] ✂️ Removing {m_target} from active miners.")
            self.active_miners.remove(m_target)
            
        self.append_block_to_chain(block_hash, miner=winner, reward=reward_claimed, nonce=nonce)
        
        # Step 4: Consensus Reached & Finalized (Single-Tick Pipeline)
        self.step = 4
        await self.broadcast()
        
        # Reset to Equilibrium after a short delay for UX
        self.step = 0
        
        # Finalize active_miners for the next cycle
        self.active_miners = list(self.troop_ledger.keys())
        
        self.current_mempool = None
        self.reset_submissions()
        await self.broadcast()
        print("[DEBUG] PIPELINE COMPLETE. Step 4 finalized. Back to Equilibrium.")
        return {"message": "Consensus reached. Simulation at Equilibrium.", "step": self.step}

    async def check_synchronization(self):
        """Helper to check if all nodes have acknowledged."""
        return len(self.acknowledgements) >= len(self.active_miners)
