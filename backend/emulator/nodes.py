import requests
import time
import hashlib
import json
import threading

API_URL = "http://127.0.0.1:8000"
MAX_TARGET = 2**256 - 1

# Gerçek Gossip Simülasyonu: Bulan thread (node), bulduğu bloğu ağa "gossip" (fısıldama) olarak yayar
gossip_lock = threading.Lock()
gossiped_blocks = {} # phase -> block_hash

def _calculate_merkle_root(mempool: dict) -> str:
    tx_string = json.dumps(mempool, sort_keys=True)
    return hashlib.sha256(hashlib.sha256(tx_string.encode()).digest()).hexdigest()

def calculate_pow_hash(previous_hash: str, merkle_root: str, difficulty: int, nonce: int, timestamp: float) -> str:
    """
    Gerçek blockchain simülasyonu: Header + Double SHA256 (Version + PrevHash + MerkleRoot + Time + Difficulty + Nonce)
    """
    header = f"1{previous_hash}{merkle_root}{timestamp}{difficulty}{nonce}"
    
    first_hash = hashlib.sha256(header.encode()).digest()
    return hashlib.sha256(first_hash).hexdigest()

def mine(node_name: str, sim_id: str, stop_event: threading.Event, difficulty: int = 50000):
    """
    Gerçek POW: Bulunan Hash'in (hex'ten integer'a çevrildikten sonra) Hedef (Target) 
    sayısından küçük olması zorunludur. (Target = MAX_TARGET / difficulty)
    """
    last_mined_phase = None
    
    print(f"[{node_name}] Mining node started for simulation {sim_id}. Waiting for Mempool orders...")
    
    while not stop_event.is_set():
        try:
            mempool_req = requests.get(f"{API_URL}/api/simulation/{sim_id}/mempool").json()
            mempool = mempool_req.get("mempool")
            previous_hash = mempool_req.get("previous_hash")
            index_to_mine = mempool_req.get("index_to_mine")

            if mempool and mempool.get("phase"):
                current_phase = mempool.get("phase")
                
                if current_phase != last_mined_phase:
                    print(f"[{node_name}] received mempool. Mining Block {index_to_mine} for Phase {current_phase}...")
                    
                    nonce = 0
                    timestamp = time.time()
                    target_int = MAX_TARGET // difficulty
                    merkle_root = _calculate_merkle_root(mempool)
                    
                    while not stop_event.is_set():
                        # GOSSIP AĞI KONTROLÜ: Eğer başka bir Node bloğu bulup yaymışsa onu kabul et ve doğrula
                        with gossip_lock:
                            if current_phase in gossiped_blocks:
                                attempt_hash = gossiped_blocks[current_phase]
                                print(f"[{node_name}] 📡 Gossiped block accepted! Validating and voting: {attempt_hash[:10]}...")
                                payload = {
                                    "country_id": node_name,
                                    "block_hash": attempt_hash,
                                    "phase": current_phase
                                }
                                try:
                                    requests.post(f"{API_URL}/api/simulation/{sim_id}/miner/submit", json=payload, timeout=2)
                                    last_mined_phase = current_phase
                                except: pass
                                break
                        
                        attempt_hash = calculate_pow_hash(previous_hash, merkle_root, difficulty, nonce, timestamp)
                        
                        if int(attempt_hash, 16) <= target_int:
                            # Tüm ağa (other threads) gossip olarak bildir
                            with gossip_lock:
                                if current_phase not in gossiped_blocks:
                                    print(f"[{node_name}] ⛏️  Mined block first! Broadcasting Gossips. Hash: {attempt_hash[:10]}... (Nonce: {nonce})")
                                    gossiped_blocks[current_phase] = attempt_hash
                                else:
                                    attempt_hash = gossiped_blocks[current_phase]
                                    print(f"[{node_name}] 🏳️ Own hash found, but yielding to gossip: {attempt_hash[:10]}...")
                                    
                            payload = {
                                "country_id": node_name,
                                "block_hash": attempt_hash,
                                "phase": current_phase
                            }
                            try:
                                requests.post(f"{API_URL}/api/simulation/{sim_id}/miner/submit", json=payload, timeout=2)
                                last_mined_phase = current_phase
                            except: pass
                            break
                        nonce += 1
                        
            time.sleep(1) # Frequency of polling for mempool
            
        except Exception as e:
            # Silent fallback for connection errors
            time.sleep(2)

    print(f"[{node_name}] Mining node stopped.")

class NodeManager:
    def __init__(self):
        self.active_threads = {} # country_id -> (thread, stop_event)
        self.current_sim_id = None

    def sync_miners(self):
        try:
            # We use /api/state to see the current active miners in the orchestrator ledger
            resp = requests.get(f"{API_URL}/api/state", timeout=2).json()
            active_countries = resp.get("ledger", {}).keys()
            new_sim_id = resp.get("simulation_id")
            
            # If simulation changed, stop all old threads
            if new_sim_id != self.current_sim_id:
                for country, (thread, stop_event) in self.active_threads.items():
                    print(f"[MANAGER] 🛑 Simulation changed. Stopping old thread for {country}")
                    stop_event.set()
                self.active_threads.clear()
                self.current_sim_id = new_sim_id
                # Reset gossips for the new simulation
                global gossiped_blocks
                with gossip_lock:
                    gossiped_blocks.clear()
            
            if not self.current_sim_id:
                return

            # Start new threads for added countries
            for country in active_countries:
                if country not in self.active_threads:
                    print(f"[MANAGER] 🌍 Dynamic node discovery: Starting thread for {country}")
                    stop_event = threading.Event()
                    thread = threading.Thread(target=mine, args=(country, self.current_sim_id, stop_event))
                    thread.daemon = True
                    thread.start()
                    self.active_threads[country] = (thread, stop_event)
            
            # Stop threads for removed countries
            to_remove = []
            for country, (thread, stop_event) in self.active_threads.items():
                if country not in active_countries:
                    print(f"[MANAGER] 🛑 Dynamic node removal: Stopping thread for {country}")
                    stop_event.set()
                    to_remove.append(country)
            
            for country in to_remove:
                del self.active_threads[country]
                
        except Exception as e:
            # print(f"[MANAGER] Sync error: {e}")
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
