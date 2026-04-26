import requests
import time
import hashlib
import json
import threading

API_URL = "http://127.0.0.1:8000"
MAX_TARGET = 2**256 - 1

# Gerçek Gossip Simülasyonu: Bulan thread (node), bulduğu bloğu ağa "gossip" (fısıldama) olarak yayar
gossip_lock = threading.Lock()
gossiped_blocks = {} # index_to_mine -> block_hash

def _calculate_merkle_root(mempool: dict) -> str:
    tx_string = json.dumps(mempool, sort_keys=True)
    return hashlib.sha256(hashlib.sha256(tx_string.encode()).digest()).hexdigest()

def calculate_pow_hash(previous_hash: str, merkle_root: str, difficulty: int, nonce: int, timestamp: float, miner: str, reward: int) -> str:
    """
    Gerçek blockchain simülasyonu: Header + Double SHA256 (Version + PrevHash + MerkleRoot + Time + Difficulty + Nonce + Miner + Reward)
    """
    header = f"1{previous_hash}{merkle_root}{timestamp}{difficulty}{nonce}{miner}{reward}"
    
    first_hash = hashlib.sha256(header.encode()).digest()
    return hashlib.sha256(first_hash).hexdigest()

def mine(node_name: str, sim_id: str, stop_event: threading.Event, difficulty: int = 500000):
    """
    Gerçek POW: Bulunan Hash'in (hex'ten integer'a çevrildikten sonra) Hedef (Target) 
    sayısından küçük olması zorunludur. (Target = MAX_TARGET / difficulty)

    ASKER SAYISI ETKİSİ: Asker sayısı hashrate ile eşdeğerdir. 
    Daha fazla askeri olan ülkenin Target'ı daha büyük (ihtimali daha yüksek) olur.
    """
    last_mined_index = None
    last_mined_phase = None
    acknowledged_index = None
    
    print(f"[{node_name}] Mining node started for simulation {sim_id}. Waiting for Mempool orders...")
    
    while not stop_event.is_set():
        try:
            mempool_req = requests.get(f"{API_URL}/api/simulation/{sim_id}/mempool").json()
            mempool = mempool_req.get("mempool")
            previous_hash = mempool_req.get("previous_hash")
            index_to_mine = mempool_req.get("index_to_mine")
            current_ledger = mempool_req.get("current_ledger", {})

            if mempool and mempool.get("phase"):
                current_phase = mempool.get("phase")
                
                if index_to_mine != last_mined_index or current_phase != last_mined_phase:
                    print(f"[{node_name}] received mempool. Mining Block {index_to_mine} for Phase {current_phase}...")
                    last_mined_phase = current_phase
                    
                    nonce = 0
                    timestamp = time.time()
                    
                    # ASKER SAYISI (HASHRATE) LOGIC:
                    # Target, ülkenin asker sayısı ile doğru orantılıdır.
                    # Asker sayısı arttıkça Target büyür, dolayısıyla hash'in target altında kalma ihtimali artar.
                    node_power = current_ledger.get(node_name, 1000)
                    target_int = (MAX_TARGET // difficulty) * node_power
                    
                    # Safety check
                    if target_int > MAX_TARGET:
                        target_int = MAX_TARGET

                    merkle_root = _calculate_merkle_root(mempool)
                    
                    gossip_key = (index_to_mine, current_phase)
                    while not stop_event.is_set():
                        # GOSSIP AĞI KONTROLÜ: Eğer başka bir Node bloğu bulup yaymışsa onu kabul et ve doğrula
                        # Key includes phase to avoid Phase 1 and Phase 3 colliding on same block index
                        with gossip_lock:
                            if gossip_key in gossiped_blocks:
                                attempt_hash = gossiped_blocks[gossip_key]
                                print(f"[{node_name}] 📡 Gossiped block accepted! Stopping mining for Block {index_to_mine}.")
                                last_mined_index = index_to_mine
                                break
                        
                        # PREEMPTION CHECK: Every ~50k nonces, check if the Gateway moved to a new phase
                        if nonce % 50000 == 0:
                            try:
                                check_req = requests.get(f"{API_URL}/api/simulation/{sim_id}/mempool", timeout=1).json()
                                check_m = check_req.get("mempool")
                                check_idx = check_req.get("index_to_mine")
                                if check_idx != index_to_mine or (check_m and check_m.get("phase") != current_phase):
                                    break
                            except: pass
                            
                        reward_to_claim = mempool.get("base_reward", 1000)
                        attempt_hash = calculate_pow_hash(previous_hash, merkle_root, difficulty, nonce, timestamp, node_name, reward_to_claim)
                        
                        if int(attempt_hash, 16) <= target_int:
                            # State Transformation By Node
                            new_ledger = current_ledger.copy()
                            new_ledger[node_name] = new_ledger.get(node_name, 0) + reward_to_claim
                            
                            if current_phase == 1:
                                m_type = mempool.get("type", "")
                                m_target = mempool.get("target")
                                if "GOD_INTERVENTION" in m_type:
                                    change = mempool.get("change", 0)
                                    new_ledger[m_target] = max(0, new_ledger.get(m_target, 0) + change)
                                elif "COUNTRY_ADD" in m_type:
                                    new_ledger[m_target] = mempool.get("starting_troops", 10000)
                                elif "COUNTRY_REMOVE" in m_type:
                                    new_ledger.pop(m_target, None)
                                    
                            elif current_phase == 3:
                                # İttifak giriş ve çıkış bedellerini öde (Smart Contract Escrow Execution)
                                ledger_updates = mempool.get("data", {}).get("ledger_updates", {})
                                for country, change in ledger_updates.items():
                                    if country in new_ledger:
                                        # change is usually negative for fees
                                        new_ledger[country] = max(0, new_ledger.get(country, 0) + change)
                            
                            # Tüm ağa (other threads) gossip olarak bildir
                            with gossip_lock:
                                if gossip_key not in gossiped_blocks:
                                    print(f"[{node_name}] ⛏️  Mined block first! Broadcasting Gossips. Hash: {attempt_hash[:10]}... (Nonce: {nonce})")
                                    gossiped_blocks[gossip_key] = attempt_hash
                                else:
                                    attempt_hash = gossiped_blocks[gossip_key]
                                    print(f"[{node_name}] 🏳️ Own hash found, but yielding to gossip: {attempt_hash[:10]}...")
                                    
                            payload = {
                                "country_id": node_name,
                                "block_hash": attempt_hash,
                                "phase": current_phase,
                                "reward_claimed": reward_to_claim,
                                "updated_ledger": new_ledger,
                                "nonce": nonce
                            }
                            try:
                                requests.post(f"{API_URL}/api/simulation/{sim_id}/miner/submit", json=payload, timeout=2)
                                last_mined_index = index_to_mine
                            except: pass
                            break
                        nonce += 1

                # If we just finished mining/gossiping a block, and haven't acknowledged it yet, do it now.
                if last_mined_index == index_to_mine and acknowledged_index != index_to_mine:
                    try:
                        resp = requests.post(f"{API_URL}/api/simulation/{sim_id}/miner/acknowledge?country_id={node_name}", timeout=2)
                        if resp.status_code == 200:
                            acknowledged_index = index_to_mine
                            print(f"[{node_name}] ✅ Block {index_to_mine} acknowledged to Gateway.")
                        else:
                            # Gateway might not be in Step 2 yet, we'll retry next loop
                            pass
                    except: pass
                        
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
