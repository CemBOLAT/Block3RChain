"""Pure helpers for snapshotting the gateway mempool and deriving a deterministic block payload."""

import copy
import hashlib
import json

import requests

from config import API_BASE_URL
from engine.solver import calculate_alliances
from emulator.happiness import apply_happiness_drift, apply_unhappy_emigration
from emulator.ledger import (
    apply_economy,
    apply_interventions,
    compute_ledger_deltas,
    copy_ledger_snapshot,
)
from engine.alliance_parameters import AllianceParameters
from engine.game_parameters import GameParameters
from engine.constants import DEFAULT_ALLIANCE_PARAMETERS
from emulator.ledger_types import (
    AllianceOutcome,
    AllianceResult,
    BlockState,
    LedgerSnapshot,
    MempoolSnapshot,
)


def fetch_mempool_snapshot(sim_id: str) -> MempoolSnapshot | None:
    try:
        raw = requests.get(
            f"{API_BASE_URL}/api/simulation/{sim_id}/mempool", timeout=2
        ).json()
    except Exception:
        return None

    mempool = copy.deepcopy(raw.get("mempool"))
    ledgers = LedgerSnapshot(
        troop=copy.deepcopy(raw.get("current_troop_ledger", {})),
        gold=copy.deepcopy(raw.get("current_gold_ledger", {})),
        pop=copy.deepcopy(raw.get("current_pop_ledger", {})),
        castle=copy.deepcopy(raw.get("current_castle_ledger", {})),
        tax=copy.deepcopy(raw.get("current_tax_ledger", {})),
        happiness=copy.deepcopy(raw.get("current_happiness_ledger", {})),
    )
    return MempoolSnapshot(
        mempool=mempool,
        previous_hash=raw.get("previous_hash"),
        index_to_mine=raw.get("index_to_mine"),
        phase=mempool.get("phase") if mempool else None,
        base_reward=int(mempool.get("base_reward", 1)) if mempool else 1,
        ledgers=ledgers,
        current_alliances=copy.deepcopy(raw.get("current_alliances", [])),
        alliance_parameters=AllianceParameters.model_validate(
            raw.get("alliance_parameters") or DEFAULT_ALLIANCE_PARAMETERS
        ),
        game_parameters=GameParameters.model_validate(raw.get("game_parameters") or {}),
    )


def prepare_block_state(snapshot: MempoolSnapshot, node_name: str) -> BlockState:
    working = copy_ledger_snapshot(snapshot.ledgers)

    reward = snapshot.base_reward
    working.troop[node_name] = working.troop.get(node_name, 0) + reward

    if int(snapshot.phase or 0) == 1 and snapshot.mempool:
        apply_interventions(
            working,
            snapshot.mempool.get("interventions", []),
            snapshot.game_parameters,
        )

    economic_deaths = apply_economy(
        working, snapshot.game_parameters, log_node=node_name
    )

    apply_happiness_drift(working.happiness, working.tax)
    unhappy_emigration = apply_unhappy_emigration(
        working, snapshot.game_parameters, log_node=node_name
    )

    if working.troop:
        alliance = calculate_alliances(
            working.troop,
            working.castle,
            snapshot.current_alliances,
            snapshot.alliance_parameters,
            snapshot.game_parameters,
        )
    else:
        alliance = AllianceResult(
            alliances=[],
            stability_score=None,
            outcome=AllianceOutcome.STABLE,
        )

    deltas = compute_ledger_deltas(working, snapshot.ledgers, economic_deaths)

    return BlockState(
        preview=working,
        economic_deaths=economic_deaths,
        unhappy_emigration=unhappy_emigration,
        alliance=alliance,
        deltas=deltas,
        reward=reward,
    )


def build_block_data(state: BlockState) -> dict:
    return {
        "new_alliances": state.alliance.alliances,
        "alliance_stability_score": state.alliance.stability_score,
        "alliance_status": state.alliance.outcome.value,
        "troop_ledger_updates": state.deltas.troop,
        "gold_ledger_updates": state.deltas.gold,
        "pop_ledger_updates": state.deltas.pop,
        "castle_ledger_updates": state.deltas.castle,
        "happiness_ledger_updates": state.deltas.happiness,
        "economic_deaths": state.economic_deaths,
        "unhappy_emigration": state.unhappy_emigration,
    }


def compute_block_merkle_root(mempool: dict, block_data: dict) -> str:
    payload = copy.deepcopy(mempool) if mempool is not None else {}
    payload["data"] = block_data
    tx_string = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(hashlib.sha256(tx_string.encode()).digest()).hexdigest()
