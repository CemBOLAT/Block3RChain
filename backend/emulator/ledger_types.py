from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class LedgerSnapshot:
    troop: dict
    gold: dict
    pop: dict


@dataclass(frozen=True)
class LedgerDeltas:
    troop: dict[str, int]
    gold: dict[str, int]
    pop: dict[str, int]


@dataclass(frozen=True)
class MempoolSnapshot:
    mempool: dict
    previous_hash: str | None
    index_to_mine: int | None
    phase: int | None
    base_reward: int
    ledgers: LedgerSnapshot
    current_alliances: list


@dataclass(frozen=True)
class AllianceInfo:
    predicted: list
    score: float | None
    status: str | None


@dataclass(frozen=True)
class BlockState:
    preview: LedgerSnapshot
    economic_deaths: dict[str, int]
    alliance_info: AllianceInfo
    deltas: LedgerDeltas
    reward: int


@dataclass(frozen=True)
class GossipedBlock:
    hash: str
    nonce: int
    timestamp: float
    miner: str
    previous_hash: str
    merkle_root: str
    reward: int
