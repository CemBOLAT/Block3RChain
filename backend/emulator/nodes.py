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

def mine(node_name: str, difficulty: int = 15000):
    """
    Gerçek POW: Bulunan Hash'in (hex'ten integer'a çevrildikten sonra) Hedef (Target) 
    sayısından küçük olması zorunludur. (Target = MAX_TARGET / difficulty)
    """
    last_mined_phase = None
    
    print(f"[{node_name}] Mining node started. Waiting for Mempool orders...")
    
    while True:
        try:
            mempool_req = requests.get(f"{API_URL}/api/mempool").json()
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
                    
                    while True:
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
                                resp = requests.post(f"{API_URL}/api/miner/submit", json=payload)
                                if resp.status_code == 200:
                                    last_mined_phase = current_phase
                                # Gossip onaylandı, madenciliği bırak (kazmayı durdur)
                                break
                        
                        attempt_hash = calculate_pow_hash(previous_hash, merkle_root, difficulty, nonce, timestamp)
                        
                        if nonce > 0 and nonce % 1000 == 0:
                            print(f"[{node_name}] 🔍 Debug: Nonce {nonce} reaching Hash {attempt_hash[:10]}...")
                        
                        # GERÇEK POW MANTIĞI: (Yarattığımız Hash Integer'ı < Hedef Threshold)
                        if int(attempt_hash, 16) <= target_int:
                            print(f"[{node_name}] ⛏️  Mined block first! Broadcasting Gossips. Hash: {attempt_hash[:10]}... (Nonce: {nonce})")
                            
                            # Tüm ağa (other threads) gossip olarak bildir
                            with gossip_lock:
                                if current_phase not in gossiped_blocks:
                                    gossiped_blocks[current_phase] = attempt_hash
                                    
                            payload = {
                                "country_id": node_name,
                                "block_hash": attempt_hash,
                                "phase": current_phase
                            }
                            resp = requests.post(f"{API_URL}/api/miner/submit", json=payload)
                            
                            if resp.status_code == 200:
                                last_mined_phase = current_phase
                            else:
                                print(f"[{node_name}] Rejected or Error: {resp.text}")
                            
                            break
                        nonce += 1
                        
            time.sleep(0.5)
            
        except Exception as e:
            print(f"[{node_name}] Connection error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    countries = ["Türkiye", "Yunanistan", "Afganistan", "Bulgaristan", "Macaristan"]
    threads = []
    
    print("Starting Block3RChain (Realistic PoW) nodes...")
    for country in countries:
        # Difficulty'i Python thread'lerinin hızlı çözebilmesi için düşürüyoruz (Örn: 50.000)
        # Çok yüksek olunca Python içinde hesaplaması saatler sürebilir.
        t = threading.Thread(target=mine, args=(country, 50000))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
