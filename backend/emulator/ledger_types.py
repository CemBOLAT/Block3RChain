from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import List


class AllianceOutcome(StrEnum):
    """Terminal game state from the alliance solver (wire JSON uses .value)."""

    STABLE = "STABLE"
    NO_STABLE_PARTITION = "NO_STABLE_PARTITION"
    # HAPPY_WORLD deferred — grand-coalition check disabled in solver (see docs/SOLVER_REDESIGN.md)


@dataclass(frozen=True)
class AllianceResult:
    alliances: List[List[str]]
    stability_score: float | None
    outcome: AllianceOutcome


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
class BlockState:
    preview: LedgerSnapshot
    economic_deaths: dict[str, int]
    alliance: AllianceResult
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
