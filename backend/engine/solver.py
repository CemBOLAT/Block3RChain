import itertools
from typing import Dict, List, Set, Tuple

class AllianceContract:
    def __init__(self, contract_id: int):
        self.contract_id = contract_id
        self.members: Set[str] = set()
        self.escrow_balance: int = 0

    def add_member(self, country: str):
        self.members.add(country)
        self.escrow_balance += 2000

    def remove_member(self, country: str):
        self.members.remove(country)
        self.escrow_balance -= 2000 # Ceza kesilir (Smart Contract mantığı)

    def get_power(self, troop_ledger: Dict[str, int]) -> int:
        return sum(troop_ledger[c] for c in self.members)
        
    def __str__(self):
        return " <-> ".join(sorted(list(self.members)))

def calculate_alliances(troop_ledger: Dict[str, int], current_alliances: List[str] = None) -> Tuple[List[str], Dict[str, int]]:
    """
    Phase 2 (Step 10 & 11): Smart Contract tabanlı Coalition Denge Hesaplayıcısı.
    1. İttifaklar artık Akıllı Sözleşme (Smart Contract) havuzlarıdır.
    2. 2'den fazla ülke tek bir ittifaka girebilir.
    3. Giriş bedeli 2000 askerdir. Bozmanın cezası 2000 askerdir.
    4. Hiçbir ittifak başka bir ittifakın 1.5 katı gücünde olmamalı (Barış Dengesi).
    """
    if current_alliances is None:
        current_alliances = []
        
    countries = list(troop_ledger.keys())
    if not countries:
        return [], {}

    contracts: List[AllianceContract] = []
    contract_counter = 0
    
    # Mevcut ittifakları yükle
    seen_countries = set()
    for alliance_str in current_alliances:
        contract_counter += 1
        contract = AllianceContract(contract_counter)
        members = alliance_str.split(" <-> ")
        for m in members:
            # Sadece hala hayatta olan VE henüz başka bir ittifaka girmemiş ülkeleri ekle (sadece 1 ittifak kuralı)
            if m in countries and m not in seen_countries: 
                contract.members.add(m)
                seen_countries.add(m)
        if len(contract.members) >= 2:
            contracts.append(contract)

    # Başlangıç durumundaki kontrat üyeliklerini kaydet
    initial_user_contracts = {c: set() for c in countries}
    for contract in contracts:
        for m in contract.members:
            initial_user_contracts[m].add(contract.contract_id)

    def is_peaceful(test_contracts: List[AllianceContract]) -> bool:
        """Sistemdeki tüm ittifakların güçleri arasındaki oranın 1.5'i geçip geçmediğini kontrol eder."""
        active = [c for c in test_contracts if len(c.members) > 1]
        if len(active) < 2:
            return True # Tek ittifak veya hiç yoksa barışçıldır
            
        powers = [c.get_power(troop_ledger) for c in active]
        max_p = max(powers)
        min_p = min(powers)
        
        # En güçlü ittifak, en zayıfın 1.5 katından büyükse savaş çıkar.
        return max_p <= min_p * 1.5

    def utility(country: str, current_contracts: List[AllianceContract]) -> float:
        """
        Ülkenin rasyonel kararı:
        - Hayatta kalma garantisi (Barışçıl bir dünya)
        - Gereksiz yere 2000 asker harcamamak (Minimum gerekli ittifaka girmek)
        - İttifakın çok büyümesi durumunda verim kaybı (Overextension penalty)
        """
        if not is_peaceful(current_contracts):
            return -99999.0 # Savaş çıkarsa hayatta kalma ihtimali düşer
            
        my_contract = next((c for c in current_contracts if country in c.members), None)
        
        if my_contract:
            # Fayda = Sahibi olunan koalisyonun defansif gücü - Akıllı sözleşme bedeli
            base_util = my_contract.get_power(troop_ledger) - 2000
            
            # Aşırı Büyüme Cezası (Overextension): İttifakta çok fazla üye varsa koordinasyon zorlaşır ve fayda azalır.
            # Ülke sayısı 3'ü geçtiğinde her bir ekstra ülke için gücün %20'si kadar ceza uygulanır.
            member_count = len(my_contract.members)
            if member_count > 3:
                penalty_factor = (member_count - 3) * 0.20
                base_util -= (base_util * penalty_factor)
                
            return base_util
        else:
            return float(troop_ledger[country])

    # Karar Motoru (Smart Contract Execution Loop)
    changed = True
    loop_limit = 50 # Sonsuz döngüyü engellemek için
    
    while changed and loop_limit > 0:
        changed = False
        loop_limit -= 1
        
        for c in countries:
            if troop_ledger[c] < 2000:
                continue # Akıllı sözleşmeye girecek parası (askeri) yok
                
            current_util = utility(c, contracts)
            best_action = None
            best_util = current_util
            
            # Action 1: Yeni bir sözleşme yaratma (Başka bir rastgele partner ile)
            for other in countries:
                if other != c and troop_ledger[other] >= 2000:
                    # Rasyonel Limit: Zaten aynı ittifaktaysanız atla
                    already_together = any((c in ct.members and other in ct.members) for ct in contracts)
                    if already_together:
                        continue

                    # Yeni kontrat simülasyonu
                    temp_contracts = [AllianceContract(ct.contract_id) for ct in contracts]
                    for tc, orig_ct in zip(temp_contracts, contracts):
                        tc.members = set(orig_ct.members)
                        
                    # Her iki tarafı da eski ittifaklarından TAMAMEN ÇIKAR (Ülkeler SADECE 1 İttifakta Olabilir)
                    for k in range(len(temp_contracts)-1, -1, -1):
                        if c in temp_contracts[k].members:
                            temp_contracts[k].remove_member(c)
                        if other in temp_contracts[k].members:
                            temp_contracts[k].remove_member(other)
                        if len(temp_contracts[k].members) <= 1:
                            temp_contracts.pop(k)

                    new_contract = AllianceContract(contract_counter + 1)
                    new_contract.add_member(c)
                    new_contract.add_member(other)
                    temp_contracts.append(new_contract)
                    
                    u = utility(c, temp_contracts)
                    u_other_old = utility(other, contracts)
                    u_other_new = utility(other, temp_contracts)
                    
                    # Her iki tarafın da fayda sağlaması (veya kaybetmemesi) gerekir
                    if u > best_util and u_other_new >= u_other_old:
                        best_util = u
                        best_action = ("CREATE", other)

            # Action 2: Var olan bir sözleşmeye katılma (Çoklu ülke)
            for i, contract in enumerate(contracts):
                if c not in contract.members:
                    temp_contracts = [AllianceContract(ct.contract_id) for ct in contracts]
                    for tc, orig_ct in zip(temp_contracts, contracts):
                        tc.members = set(orig_ct.members)
                        
                    # ÖNCE KENDİ ESKİ İTTİFAKINDAN ÇIK (Bir ülke max 1 ittifak kurabilir)
                    for k in range(len(temp_contracts)-1, -1, -1):
                        if c in temp_contracts[k].members:
                            temp_contracts[k].remove_member(c)
                            if len(temp_contracts[k].members) <= 1:
                                temp_contracts.pop(k)

                    # Simüle edilmiş (yeni güncel indeks) kontratı id'den bul (pop() indexleri değiştirmiş olabilir)
                    target_tc = next((tc for tc in temp_contracts if tc.contract_id == contract.contract_id), None)
                    if target_tc:
                        target_tc.add_member(c)
                        u = utility(c, temp_contracts)
                        if u > best_util:
                            best_util = u
                            best_action = ("JOIN", target_tc.contract_id)

            # Action 3: Var olan bir sözleşmeden çıkma (2000 ceza ödemeyi göze alarak, tek başıma kalsam daha mı karlı?)
            for contract in contracts:
                if c in contract.members:
                    temp_contracts = [AllianceContract(ct.contract_id) for ct in contracts]
                    for tc, orig_ct in zip(temp_contracts, contracts):
                        tc.members = set(orig_ct.members)
                        
                    # İttifaktan tamamen çık
                    for k in range(len(temp_contracts)-1, -1, -1):
                        if c in temp_contracts[k].members:
                            temp_contracts[k].remove_member(c)
                            if len(temp_contracts[k].members) <= 1:
                                temp_contracts.pop(k)
                    
                    u = utility(c, temp_contracts) - 2000 # Çıkış Opportunity Cost (cayma bedeli düşünülerek karar alınır) 
                    if u > best_util:
                        best_util = u
                        best_action = ("LEAVE", None)

            # En iyi aksiyonu uygula
            if best_action:
                changed = True
                act_type, param = best_action
                
                # UYGULAMA AŞAMASI: Hangi eylemi yaparsa yapsın önce mevcut(lar)dan çıkması garanti edilmeli
                for idx in range(len(contracts)-1, -1, -1):
                    if c in contracts[idx].members:
                        contracts[idx].remove_member(c)
                    if act_type == "CREATE" and param in contracts[idx].members:
                        contracts[idx].remove_member(param)
                    if len(contracts[idx].members) <= 1:
                        contracts.pop(idx)

                if act_type == "CREATE":
                    contract_counter += 1
                    nc = AllianceContract(contract_counter)
                    nc.add_member(c)
                    nc.add_member(param)
                    contracts.append(nc)
                elif act_type == "JOIN":
                    target_ct = next((ct for ct in contracts if ct.contract_id == param), None)
                    if target_ct:
                        target_ct.add_member(c)
                elif act_type == "LEAVE":
                    pass # Zaten çıkarıldı
                break # Yeniden başla (Sıradaki aktörün dinamikleri değişti)

    # Sonuçları listeye dönüştür (En az 2 üyeli sözleşmeler)
    resolved_alliances = set()
    final_user_contracts = {c: set() for c in countries}
    
    for contract in contracts:
        if len(contract.members) >= 2:
            resolved_alliances.add(str(contract))
            # Ülkelerin nihai ittifak id'lerini hesapla
            for m in contract.members:
                final_user_contracts[m].add(contract.contract_id)

    # İşlem başındaki ve sonundaki ittifak farklarına göre Smart Contract ücretlerini kes
    ledger_changes = {c: 0 for c in countries}
    for c in countries:
        initial_set = initial_user_contracts[c]
        final_set = final_user_contracts[c]
        
        # Çıktığı/Bozulan ittifaklar (2000 ceza (penalty))
        left_contracts = initial_set - final_set
        
        # Girdiği yeni ittifaklar (2000 escrow)
        joined_contracts = final_set - initial_set
        
        ledger_changes[c] -= len(left_contracts) * 2000
        ledger_changes[c] -= len(joined_contracts) * 2000

    # Güncellenmemiş 0'ları temizle
    ledger_changes = {k: v for k, v in ledger_changes.items() if v != 0}

    # Dünya barışı sağlanamadıysa ve bir güç diğerlerini domine ediyorsa
    if not is_peaceful(contracts) and len(contracts) > 0:
        return ["WORLD WAR 3: EQUILIBRIUM COLLAPSED"], ledger_changes

    return list(resolved_alliances), ledger_changes

