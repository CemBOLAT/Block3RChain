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
        raw = requests.get(f"{API_BASE_URL}/api/simulation/{sim_id}/mempool", timeout=2).json()
    except Exception:
        return None

    mempool = copy.deepcopy(raw.get("mempool"))
    ledgers = LedgerSnapshot(
        troop=copy.deepcopy(raw.get("current_troop_ledger", {})),
        gold=copy.deepcopy(raw.get("current_gold_ledger", {})),
        pop=copy.deepcopy(raw.get("current_pop_ledger", {})),
        castle=copy.deepcopy(raw.get("current_castle_ledger", {})),
        tax=copy.deepcopy(raw.get("current_tax_ledger", {})),
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
        game_parameters=GameParameters.model_validate(
            raw.get("game_parameters") or {}
        ),
        tax_ledger=copy.deepcopy(raw.get("tax_ledger", {})),
    )


def _apply_interventions(
    troop: dict, gold: dict, pop: dict, castle: dict, tax: dict,
    interventions: list, game_parameters: GameParameters
) -> None:
    for intervention in interventions:
        i_type = intervention.get("type", "")
        i_target = intervention.get("target")
        if "GOD_INTERVENTION" in i_type:
            update_ledger_of_country(troop, gold, pop, intervention)
        elif "COUNTRY_ADD" in i_type:
            add_country_to_ledger(troop, gold, pop, intervention)
            castle[i_target] = []
            tax[i_target] = 1.0  # default tax rate for new country
        elif "COUNTRY_REMOVE" in i_type:
            remove_country_from_ledger(troop, gold, pop, i_target)
            castle.pop(i_target, None)
            tax.pop(i_target, None)
        elif "BUILD_CASTLE" in i_type:
            level = int(intervention.get("level", 1))
            cost = game_parameters.castles[level].build_cost
            gold[i_target] = max(0, gold.get(i_target, 0) - cost)
            if i_target not in castle:
                castle[i_target] = []
            castle[i_target].append(level)
        elif "DEMOLISH_CASTLE" in i_type:
            level = int(intervention.get("level", 1))
            if i_target in castle and level in castle[i_target]:
                castle[i_target].remove(level)
        elif "SET_TAX_RATE" in i_type:
            rate = float(intervention.get("tax_rate", 1.0))
            tax[i_target] = max(0.0, min(2.0, rate))


def prepare_block_state(snapshot: MempoolSnapshot, node_name: str) -> BlockState:
    troop = dict(snapshot.ledgers.troop)
    gold = dict(snapshot.ledgers.gold)
    pop = dict(snapshot.ledgers.pop)
    castle = copy.deepcopy(snapshot.ledgers.castle)
    tax = dict(snapshot.tax_ledger)  # copy tax ledger

    reward = snapshot.base_reward
    troop[node_name] = troop.get(node_name, 0) + reward

    if snapshot.phase == 1 and snapshot.mempool:
        _apply_interventions(
            troop, gold, pop, castle, tax,
            snapshot.mempool.get("interventions", []),
            snapshot.game_parameters
        )

    economic_deaths = apply_economy(
        troop, gold, pop,
        castle_ledger=castle,
        game_parameters=snapshot.game_parameters,
        tax_ledger=tax,
        log_node=node_name
    )

    if troop:
        alliance = calculate_alliances(
            troop,
            snapshot.current_alliances,
            snapshot.alliance_parameters,
            game_parameters=snapshot.game_parameters,
            castle_ledger=castle,
        )
    else:
        alliance = AllianceResult(
            alliances=[],
            stability_score=None,
            outcome=AllianceOutcome.STABLE,
        )

    preview = LedgerSnapshot(troop=troop, gold=gold, pop=pop, castle=castle, tax=tax)
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
        "alliance_status": state.alliance.outcome.value,
        "troop_ledger_updates": state.deltas.troop,
        "gold_ledger_updates": state.deltas.gold,
        "pop_ledger_updates": state.deltas.pop,
        "castle_ledger_updates": state.deltas.castle,
        "economic_deaths": state.economic_deaths,
    }


def compute_block_merkle_root(mempool: dict, block_data: dict) -> str:
    payload = copy.deepcopy(mempool) if mempool is not None else {}
    payload["data"] = block_data
    tx_string = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(hashlib.sha256(tx_string.encode()).digest()).hexdigest()
