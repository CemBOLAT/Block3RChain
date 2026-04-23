import pulp
import itertools
from typing import Dict, List

def calculate_alliances(troop_ledger: Dict[str, int]) -> List[str]:
    """
    Phase 2 (Step 10 & 11): PuLP dayalı Alliance (İttifak) hesaplayıcısı.
    Amaç: Asker sayısına (troops) göre ülkeleri ikili ittifaklara bölmek ve
    dünya gücünü dengede tutmak (Nash Equilibrium Approximation).
    """
    countries = list(troop_ledger.keys())
    # Olası tüm ikili ülke kombinasyonları
    pairs = list(itertools.combinations(countries, 2))

    # LPR (Linear Programming) Modeli (Maksimizasyon)
    prob = pulp.LpProblem("Nash_Equilibrium_Alliances", pulp.LpMaximize)

    # Karar Değişkenleri: Her bir [ülke_1, ülke_2] ikilisi ittifak kuracak mı? (0 veya 1)
    x_vars = {}
    for c1, c2 in pairs:
        x_vars[(c1, c2)] = pulp.LpVariable(f"alliance_{c1}_{c2}", cat=pulp.LpBinary)

    # Kısıt (Constraint): Her ülke en fazla 1 ittifak kurabilir.
    for c in countries:
        prob += pulp.lpSum(x_vars[(c1, c2)] for c1, c2 in pairs if c in (c1, c2)) <= 1

    # İttifakların gücünü dünya ortalamasında dengelemek için Ödül / Ceza mekanizması.
    # Toplam güç ortalama gücün %150'sine ne kadar yakınsa o kadar iyi puan alır.
    total_troops = sum(troop_ledger.values())
    avg_troops = total_troops / max(1, len(countries))
    ideal_alliance_power = avg_troops * 1.5
    
    objective = []
    for c1, c2 in pairs:
        pair_sum = troop_ledger[c1] + troop_ledger[c2]
        # Ceza: ideal güçten ne kadar uzaklaştığımız
        penalty = abs(pair_sum - ideal_alliance_power)
        # Ödül: Maksimum olası cezadan mevcut cezayı çıkarıyoruz ki sonuç her zaman pozitif olsun. 
        # Bu sayede solver hiç ittifak kurmamak (0 puan) yerine ittifak kurmayı (pozitif puan) seçecektir.
        reward = total_troops - penalty
        objective.append(reward * x_vars[(c1, c2)])
        
    # Amaç Fonksiyonu (Objective Function) ayarlanıyor
    prob += pulp.lpSum(objective)

    # Çözücü motoru çalıştır (Sessiz mod)
    prob.solve(pulp.PULP_CBC_CMD(msg=False))

    alliances = []
    for c1, c2 in pairs:
        if pulp.value(x_vars[(c1, c2)]) == 1.0:
            alliances.append(f"{c1} <-> {c2}")

    return alliances

