import os
import sys
import threading
import time
import requests

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import API_BASE_URL
from emulator import mining
from emulator.ledger_types import MempoolSnapshot
from emulator.mempool import (
    build_block_data,
    compute_block_merkle_root,
    fetch_mempool_snapshot,
    prepare_block_state,
)
from emulator.mining import (
    build_submit_payload,
    compute_target,
    proof_of_work,
    submit_block,
)

def _country_removal_pending(mempool: dict, node_name: str) -> bool:
    for intervention in mempool.get("interventions", []):
        if intervention.get("target") == node_name and "COUNTRY_REMOVE" in intervention.get("type", ""):
            return True
    return False


def _detect_self_removal(snapshot: MempoolSnapshot | None, node_name: str) -> bool:
    if snapshot is None:
        return False
    if snapshot.mempool and _country_removal_pending(snapshot.mempool, node_name):
        return True
    troop = snapshot.ledgers.troop if snapshot.ledgers else None
    if troop and node_name not in troop:
        return True
    return False


def should_idle_poll(
    snapshot: MempoolSnapshot | None,
    last_handled: tuple | None,
) -> bool:
    return (
        snapshot is None
        or snapshot.mempool is None
        or not snapshot.phase
        or snapshot.phase == 2
        or (last_handled is not None and last_handled == (snapshot.index_to_mine, snapshot.phase))
    )


def mine(node_name: str, sim_id: str, stop_event: threading.Event, difficulty: int = 500000):
    last_handled: tuple | None = None

    print(f"[{node_name}] Mining node started for simulation {sim_id}. Waiting for Mempool orders...")
    while not stop_event.is_set():
        try:
            snapshot = fetch_mempool_snapshot(sim_id)

            if _detect_self_removal(snapshot, node_name):
                print(f"[{node_name}] Scheduled for removal. Shutting down node.")
                stop_event.set()
                return

            if should_idle_poll(snapshot, last_handled):
                time.sleep(1)
                continue

            print(
                f"[{node_name}] received mempool. Mining Block {snapshot.index_to_mine} "
                f"for Phase {snapshot.phase}..."
            )

            state = prepare_block_state(snapshot, node_name)
            block_data = build_block_data(state)
            merkle_root = compute_block_merkle_root(snapshot.mempool, block_data)
            target_int = compute_target(state.preview.troop.get(node_name, 1), difficulty)

            accepted = proof_of_work(
                sim_id=sim_id,
                gossip_key=(snapshot.index_to_mine, snapshot.phase),
                target_int=target_int,
                previous_hash=snapshot.previous_hash,
                merkle_root=merkle_root,
                difficulty=difficulty,
                miner=node_name,
                reward=state.reward,
                current_phase=snapshot.phase,
                index_to_mine=snapshot.index_to_mine,
                stop_event=stop_event,
                log_node=node_name,
            )

            if accepted is None:
                continue

            if accepted.miner == node_name:
                payload = build_submit_payload(node_name, accepted, state, snapshot.phase)
                if not submit_block(sim_id, payload, log_node=node_name):
                    continue

            last_handled = (snapshot.index_to_mine, snapshot.phase)
            time.sleep(1)
        except Exception as exc:
            print(f"[{node_name}] ⚠️ Mining loop error: {exc!r}")
            time.sleep(2)

    print(f"[{node_name}] Mining node stopped.")


class NodeManager:
    def __init__(self):
        self.active_threads = {}  # country_id -> (thread, stop_event)
        self.current_sim_id = None

    def sync_miners(self):
        try:
            resp = requests.get(f"{API_BASE_URL}/api/state", timeout=2).json()
            active_countries = resp.get("ledger", {}).keys()
            new_sim_id = resp.get("simulation_id")

            if new_sim_id != self.current_sim_id:
                for country, (_thread, stop_event) in self.active_threads.items():
                    print(f"[MANAGER] 🛑 Simulation changed. Stopping old thread for {country}")
                    stop_event.set()
                self.active_threads.clear()
                self.current_sim_id = new_sim_id
                mining.clear_gossip_cache()

            current_step = resp.get("step", 0)

            if not self.current_sim_id:
                return

            if current_step == 0:
                for country in active_countries:
                    if country not in self.active_threads:
                        print(f"[MANAGER] 🌍 Dynamic node discovery: Starting thread for {country}")
                        stop_event = threading.Event()
                        thread = threading.Thread(
                            target=mine, args=(country, self.current_sim_id, stop_event)
                        )
                        thread.daemon = True
                        thread.start()
                        self.active_threads[country] = (thread, stop_event)

            to_remove = []
            for country, (_thread, stop_event) in self.active_threads.items():
                if country not in active_countries:
                    print(f"[MANAGER] 🛑 Dynamic node removal: Stopping thread for {country}")
                    stop_event.set()
                    to_remove.append(country)

            for country in to_remove:
                del self.active_threads[country]

        except Exception:
            pass

    def run(self):
        print("🚀 Block3RChain Dynamic Node Manager started.")
        print("Polling orchestrator for active countries...")
        while True:
            self.sync_miners()
            time.sleep(3)


if __name__ == "__main__":
    manager = NodeManager()
    manager.run()
