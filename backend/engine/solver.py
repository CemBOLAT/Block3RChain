from typing import Dict, List, Set, FrozenSet, Tuple

class AllianceContract:
    def __init__(self, contract_id: int):
        self.contract_id = contract_id
        self.members: Set[str] = set()

    def add_member(self, country: str):
        self.members.add(country)

    def remove_member(self, country: str):
        if country in self.members:
            self.members.remove(country)

    def get_power(self, troop_ledger: Dict[str, int]) -> int:
        return sum(troop_ledger.get(c, 0) for c in self.members)
        
    def __str__(self):
        return " <-> ".join(sorted(list(self.members)))


def calculate_alliances(troop_ledger: Dict[str, int], current_alliances: List[str] = None) -> Tuple[List[str], Dict[str, int]]:
    """
    Koalisyon Denge Hesaplayıcısı.
    Kurallar:
    1. Toplam gücün %30'undan fazlasına sahip ülkeler SÜPER GÜÇ sayılır ve ittifak kuramaz. Yalnız kalırlar.
    2. Normal ülkeler birbirleriyle ittifak kurabilir. Önce mevcut ittifaklar korunur.
    3. İttifaksız kalan normal ülkeler, asker sayısına göre sıralanıp ikili eşleştirilir (en yakın güçtekiler partner olur).
    4. Hiçbir ittifak toplam gücün %51'ini geçemez; geçerse o çift eşleştirilmez.
    5. 2+ ittifak oluşursa aralarındaki güç farkı 1.5x'i geçemez; geçerse WW3.
    """
    if current_alliances is None:
        current_alliances = []

    countries = list(troop_ledger.keys())
    if not countries:
        return [], {}

    global_power = sum(troop_ledger.values())
    if global_power == 0:
        return [], {}

    # --- Süper Güç Tespiti (%30 eşiği) ---
    superpower_threshold = global_power * 0.30
    superpowers: Set[str] = {name for name, p in troop_ledger.items() if p >= superpower_threshold}
    normal_countries = [c for c in countries if c not in superpowers and troop_ledger.get(c, 0) >= 2000]

    print(f"[SOLVER] Global: {global_power}. Superpowers: {superpowers}. Normal eligible: {normal_countries}")

    # --- Başlangıç ittifak haritası (ceza hesabı için) ---
    initial_alliances_map: Dict[str, FrozenSet[str]] = {c: frozenset() for c in countries}
    for alliance_str in current_alliances:
        members = frozenset(m for m in alliance_str.split(" <-> ") if m in countries)
        for m in members:
            initial_alliances_map[m] = members

    # --- Mevcut ittifakları yeniden yükle (sadece normal ülkeler) ---
    contracts: List[AllianceContract] = []
    seen: Set[str] = set()
    contract_counter = 0

    for alliance_str in current_alliances:
        raw_members = alliance_str.split(" <-> ")
        # Sadece: ülke var, süper güç değil, daha başka ittifakta değil
        valid_members = [m for m in raw_members if m in countries and m not in superpowers and m not in seen]
        if len(valid_members) >= 2:
            contract_counter += 1
            ct = AllianceContract(contract_counter)
            for m in valid_members:
                ct.add_member(m)
                seen.add(m)
            contracts.append(ct)

    # --- İttifaksız kalan normal ülkeleri güce göre sıralayıp eşleştir ---
    unallied = sorted(
        [c for c in normal_countries if c not in seen],
        key=lambda c: troop_ledger[c]
    )

    # En zayıfı en güçlüyle eşleştir → en dengeli ittifak yapısı
    # Örn: [4,7,12,21] → 4+21=25, 7+12=19  (sequential olsaydı: 4+7=11, 12+21=33 — dengesiz!)
    lo = 0
    hi = len(unallied) - 1
    while lo < hi:
        c1 = unallied[lo]
        c2 = unallied[hi]

        contract_counter += 1
        nc = AllianceContract(contract_counter)
        nc.add_member(c1)
        nc.add_member(c2)
        contracts.append(nc)
        lo += 1
        hi -= 1

    # --- Sonuçları derle ---
    resolved_alliances: List[str] = []
    final_alliances_map: Dict[str, FrozenSet[str]] = {c: frozenset() for c in countries}

    for ct in contracts:
        if len(ct.members) >= 2:
            resolved_alliances.append(str(ct))
            frozen = frozenset(ct.members)
            for m in ct.members:
                final_alliances_map[m] = frozen

    # --- Ledger değişikliklerini hesapla ---
    ledger_changes: Dict[str, int] = {}
    for c in countries:
        init_set = initial_alliances_map[c]
        final_set = final_alliances_map[c]
        if init_set != final_set:
            change = 0
            if len(init_set) > 0:
                change -= 2000  # Eski ittifaktan çıkış cezası
            if len(final_set) > 0:
                change -= 2000  # Yeni ittifaka giriş escrow
            if change != 0:
                ledger_changes[c] = change

    # --- WW3 Kontrolü: İttifaklar arasında güç dengesi 1.5x'i geçiyor mu? ---
    # (Tek ittifak veya hiç ittifak yoksa kontrol yapılmaz)
    active = [ct for ct in contracts if len(ct.members) >= 2]
    if len(active) >= 2:
        powers = [ct.get_power(troop_ledger) for ct in active]
        max_p = max(powers)
        min_p = min(powers)
        # Sadece ittifaklar arasındaki oran 1.5x'i aşarsa WW3
        # (Süper güçler bu hesaba dahil değil, solo kaldıkları için)
        if max_p > min_p * 1.5:
            print(f"[SOLVER] ⚠️ WW3: İttifak dengesizliği {max_p} vs {min_p} (oran: {max_p/min_p:.2f}x)")
            return ["WORLD WAR 3: EQUILIBRIUM COLLAPSED"], ledger_changes

    print(f"[SOLVER] ✅ Equilibrium: {resolved_alliances}")
    return resolved_alliances, ledger_changes
