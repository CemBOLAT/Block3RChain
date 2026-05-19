"""Pure helpers for snapshotting the gateway mempool and deriving a deterministic block payload."""

import copy
import hashlib
import json

import requests

from config import API_BASE_URL
from engine.solver import calculate_alliances
from emulator.ledger import (
    add_country_to_ledger,
    apply_economy,
    compute_ledger_deltas,
    remove_country_from_ledger,
    update_ledger_of_country,
)
from emulator.ledger_types import (
    BlockState,
    LedgerSnapshot,
    MempoolSnapshot,
)


def fetch_mempool_snapshot(sim_id: str) -> MempoolSnapshot | None:
    try:
        raw = requests.get(f"{API_BASE_URL}/api/simulation/{sim_id}/mempool", timeout=2).json()
    except Exception:
        return None

    mempool = copy.deepcopy(raw.get("mempool"))
    ledgers = LedgerSnapshot(
        troop=copy.deepcopy(raw.get("current_troop_ledger", {})),
        gold=copy.deepcopy(raw.get("current_gold_ledger", {})),
        pop=copy.deepcopy(raw.get("current_pop_ledger", {})),
    )
    return MempoolSnapshot(
        mempool=mempool,
        previous_hash=raw.get("previous_hash"),
        index_to_mine=raw.get("index_to_mine"),
        phase=mempool.get("phase") if mempool else None,
        base_reward=int(mempool.get("base_reward", 1)) if mempool else 1,
        ledgers=ledgers,
        current_alliances=copy.deepcopy(raw.get("current_alliances", [])),
    )


def _apply_interventions(
    troop: dict, gold: dict, pop: dict, interventions: list
) -> None:
    for intervention in interventions:
        i_type = intervention.get("type", "")
        i_target = intervention.get("target")
        if "GOD_INTERVENTION" in i_type:
            update_ledger_of_country(troop, gold, pop, intervention)
        elif "COUNTRY_ADD" in i_type:
            add_country_to_ledger(troop, gold, pop, intervention)
        elif "COUNTRY_REMOVE" in i_type:
            remove_country_from_ledger(troop, gold, pop, i_target)


def prepare_block_state(snapshot: MempoolSnapshot, node_name: str) -> BlockState:
    troop = dict(snapshot.ledgers.troop)
    gold = dict(snapshot.ledgers.gold)
    pop = dict(snapshot.ledgers.pop)

    reward = snapshot.base_reward
    troop[node_name] = troop.get(node_name, 0) + reward

    if snapshot.phase == 1 and snapshot.mempool:
        _apply_interventions(troop, gold, pop, snapshot.mempool.get("interventions", []))

    economic_deaths = apply_economy(troop, gold, pop, log_node=node_name)

    alliance = calculate_alliances(troop, snapshot.current_alliances)

    preview = LedgerSnapshot(troop=troop, gold=gold, pop=pop)
    deltas = compute_ledger_deltas(snapshot.ledgers, preview, economic_deaths)

    return BlockState(
        preview=preview,
        economic_deaths=economic_deaths,
        alliance=alliance,
        deltas=deltas,
        reward=reward,
    )


def build_block_data(state: BlockState) -> dict:
    return {
        "new_alliances": state.alliance.alliances,
        "alliance_stability_score": state.alliance.stability_score,
        "alliance_status": state.alliance.status,
        "troop_ledger_updates": state.deltas.troop,
        "gold_ledger_updates": state.deltas.gold,
        "pop_ledger_updates": state.deltas.pop,
        "economic_deaths": state.economic_deaths,
    }


def compute_block_merkle_root(mempool: dict, block_data: dict) -> str:
    payload = copy.deepcopy(mempool) if mempool is not None else {}
    payload["data"] = block_data
    tx_string = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(hashlib.sha256(tx_string.encode()).digest()).hexdigest()
