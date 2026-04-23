import hashlib
import json
import time
from typing import Dict, Any

MAX_TARGET = 2**256 - 1

def calculate_merkle_root(mempool: Dict[str, Any]) -> str:
    """Gerçek Bitcoin'deki gibi Transaction'ların Merkle ağacı kökünü hesaplar."""
    if not mempool:
        return hashlib.sha256(b"empty").hexdigest()
    # Basit bir Merkle simülasyonu (Gerçekte tx listesi ağaç şeklinde hashlenebilir)
    tx_string = json.dumps(mempool, sort_keys=True)
    return hashlib.sha256(hashlib.sha256(tx_string.encode()).digest()).hexdigest()

class Block:
    def __init__(self, index: int, previous_hash: str, mempool: Dict[str, Any], nonce: int = 0, timestamp: float = None, difficulty: int = 4, miner: str = None, reward: int = 0):
        self.version = 1
        self.index = index
        self.previous_hash = previous_hash
        self.mempool = mempool
        self.merkle_root = calculate_merkle_root(mempool)
        self.timestamp = timestamp or time.time()
        self.difficulty = difficulty
        self.nonce = nonce
        self.miner = miner
        self.reward = reward
        self.target = MAX_TARGET // self.difficulty
        self.hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        """
        Gerçek blockchainlerde (Bitcoin) hash tüm JSOn'ın değil Header'ın üzerinden Double-SHA256 ile alınır.
        Header: Version + PrevHash + MerkleRoot + Timestamp + Difficulty(Bits) + Nonce + Miner + Reward
        """
        header = f"{self.version}{self.previous_hash}{self.merkle_root}{float(self.timestamp)}{self.difficulty}{self.nonce}{self.miner}{self.reward}"
        first_hash = hashlib.sha256(header.encode()).digest()
        # Bitcoin standardı gereği ikinci kez hashlenir
        return hashlib.sha256(first_hash).hexdigest()

def create_genesis_block(initial_ledger: Dict[str, int]) -> Block:
    """Proje başladığında 5 ülke için oluşturulan ilk (Genesis) blok."""
    genesis_mempool = {
        "type": "GENESIS",
        "phase": 0,
        "participants": initial_ledger
    }
    return Block(index=0, previous_hash="0" * 64, mempool=genesis_mempool, nonce=0, difficulty=1)