import hashlib
import threading
import time
from typing import Optional

import requests

from config import API_BASE_URL
from emulator.ledger_types import BlockState, GossipedBlock

MAX_TARGET = 2**256 - 1

_gossip_lock = threading.Lock()
_gossiped_blocks: dict[tuple, GossipedBlock] = {}


def clear_gossip_cache() -> None:
    with _gossip_lock:
        _gossiped_blocks.clear()


def peek_gossiped_block(key: tuple) -> Optional[GossipedBlock]:
    with _gossip_lock:
        return _gossiped_blocks.get(key)


def record_gossiped_block(key: tuple, block: GossipedBlock) -> bool:
    with _gossip_lock:
        if key in _gossiped_blocks:
            return False
        _gossiped_blocks[key] = block
        return True


def compute_target(node_power: int, difficulty: int) -> int:
    return min(MAX_TARGET, (MAX_TARGET // difficulty) * max(node_power, 1))


def calculate_pow_hash(
    previous_hash: str,
    merkle_root: str,
    difficulty: int,
    nonce: int,
    timestamp: float,
    miner: str,
    reward: int,
) -> str:
    header = f"1{previous_hash}{merkle_root}{timestamp}{difficulty}{nonce}{miner}{reward}"
    first_hash = hashlib.sha256(header.encode()).digest()
    return hashlib.sha256(first_hash).hexdigest()


def verify_gossiped_block(
    block: GossipedBlock,
    expected_previous_hash: str,
    expected_merkle_root: str,
    difficulty: int,
    target_int: int,
) -> bool:
    if block.previous_hash != expected_previous_hash:
        return False
    if block.merkle_root != expected_merkle_root:
        return False
    recomputed = calculate_pow_hash(
        block.previous_hash,
        block.merkle_root,
        difficulty,
        block.nonce,
        block.timestamp,
        block.miner,
        block.reward,
    )
    if recomputed != block.hash:
        return False
    return int(block.hash, 16) <= target_int


def should_continue_mining_block(
    sim_id: str,
    index_to_mine,
    current_phase,
) -> bool:
    try:
        check_req = requests.get(f"{API_BASE_URL}/api/simulation/{sim_id}/mempool", timeout=1).json()
        check_m = check_req.get("mempool")
        check_idx = check_req.get("index_to_mine")
        if check_idx != index_to_mine:
            return False
        if check_m and check_m.get("phase") != current_phase:
            return False
        return True
    except Exception:
        return True


def proof_of_work(
    *,
    sim_id: str,
    gossip_key: tuple,
    target_int: int,
    previous_hash: str,
    merkle_root: str,
    difficulty: int,
    miner: str,
    reward: int,
    current_phase,
    index_to_mine,
    stop_event: threading.Event,
    log_node: str | None = None,
) -> Optional[GossipedBlock]:
    nonce = 0
    timestamp = time.time()
    while not stop_event.is_set():
        peer = peek_gossiped_block(gossip_key)
        if peer is not None:
            if verify_gossiped_block(peer, previous_hash, merkle_root, difficulty, target_int):
                if log_node:
                    print(
                        f"[{log_node}] 📡 Verified gossip from {peer.miner} for Block "
                        f"{index_to_mine} phase {current_phase}. Hash: {peer.hash[:10]}..."
                    )
                return peer
            if log_node:
                print(
                    f"[{log_node}] ⚠️ Rejected invalid gossip from {peer.miner} "
                    f"for Block {index_to_mine} phase {current_phase}."
                )

        if nonce % 50000 == 0 and not should_continue_mining_block(sim_id, index_to_mine, current_phase):
            return None

        attempt_hash = calculate_pow_hash(
            previous_hash, merkle_root, difficulty, nonce, timestamp, miner, reward
        )
        if int(attempt_hash, 16) > target_int:
            nonce += 1
            continue

        candidate = GossipedBlock(
            hash=attempt_hash,
            nonce=nonce,
            timestamp=timestamp,
            miner=miner,
            previous_hash=previous_hash,
            merkle_root=merkle_root,
            reward=reward,
        )

        if record_gossiped_block(gossip_key, candidate):
            if log_node:
                print(
                    f"[{log_node}] ⛏️  Mined block first! Broadcasting gossip. "
                    f"Hash: {attempt_hash[:10]}... (Nonce: {nonce})"
                )
            return candidate

        peer = peek_gossiped_block(gossip_key)
        if peer is not None and verify_gossiped_block(
            peer, previous_hash, merkle_root, difficulty, target_int
        ):
            if log_node:
                print(
                    f"[{log_node}] 🏳️ Own hash valid but yielding to verified gossip "
                    f"from {peer.miner}: {peer.hash[:10]}..."
                )
            return peer
        return candidate

    return None


def build_submit_payload(
    node_name: str,
    accepted: GossipedBlock,
    state: BlockState,
    current_phase,
) -> dict:
    return {
        "country_id": node_name,
        "block_hash": accepted.hash,
        "phase": current_phase,
        "reward_claimed": accepted.reward,
        "updated_ledger": dict(state.preview.troop),
        "updated_gold_ledger": dict(state.preview.gold),
        "updated_pop_ledger": dict(state.preview.pop),
        "updated_castle_ledger": {k: list(v) for k, v in state.preview.castle.items()},
        "updated_tax_ledger": dict(state.preview.tax),
        "nonce": accepted.nonce,
        "predicted_alliances": state.alliance.alliances,
        "alliance_stability_score": state.alliance.stability_score,
        "alliance_status": state.alliance.outcome.value,
        "alliance_ledger_updates": state.deltas.troop,
        "gold_ledger_updates": state.deltas.gold,
        "pop_ledger_updates": state.deltas.pop,
        "castle_ledger_updates": state.deltas.castle,
        "economic_deaths": state.economic_deaths,
    }


def submit_block(sim_id: str, payload: dict, log_node: str | None = None) -> bool:
    try:
        resp = requests.post(
            f"{API_BASE_URL}/api/simulation/{sim_id}/miner/submit",
            json=payload,
            timeout=2,
        )
    except Exception as exc:
        if log_node:
            print(f"[{log_node}] ❗ submit_block network error: {exc!r}")
        return False

    if 200 <= resp.status_code < 300:
        return True

    if log_node:
        body = resp.text[:200] if resp.text else ""
        print(
            f"[{log_node}] ❗ submit_block rejected by gateway "
            f"(status {resp.status_code}): {body}"
        )
    return False
