import pygambit
import numpy as np
import random
import itertools
from typing import Dict, List, Set, Tuple, FrozenSet

class AllianceContract:
    def __init__(self, contract_id: int):
        self.contract_id = contract_id
        self.members: Set[str] = set()

    def add_member(self, country: str):
        self.members.add(country)

    def get_power(self, troop_ledger: Dict[str, int]) -> int:
        return sum(troop_ledger.get(c, 0) for c in self.members)
        
    def __str__(self):
        return " <-> ".join(sorted(list(self.members)))

def calculate_alliances(troop_ledger: Dict[str, int], current_alliances: List[str] = None) -> Tuple[List[str], Dict[str, int]]:
    """
    Strategic Geopolitical Solver using PyGambit.
    Models the alliance formation as a Nash Equilibrium game.
    """
    if current_alliances is None:
        current_alliances = []

    countries = list(troop_ledger.keys())
    if not countries:
        return [], {}

    global_power = sum(troop_ledger.values())
    if global_power == 0:
        return [], {}

    # --- RULE 1: Super Power Detection (30% threshold) ---
    superpower_threshold = global_power * 0.30
    superpowers: Set[str] = {name for name, p in troop_ledger.items() if p >= superpower_threshold}
    
    # Players: Countries with > 2000 troops (Superpowers are now included as players)
    print(f"[SOLVER-GAMBIT] Troop Ledger for Solver: {troop_ledger}")
    candidates = [c for c in countries if troop_ledger.get(c, 0) > 2000]
    print(f"[SOLVER-GAMBIT] Candidates for Nash: {candidates}")
    
    # LIMITATION: To prevent matrix explosion, we take the top 8 most powerful countries as active players.
    candidates.sort(key=lambda x: troop_ledger[x], reverse=True)
    players_list = candidates[:8]
    
    if not players_list:
        print("[SOLVER-GAMBIT] No valid players for Nash Equilibrium.")
        return [], {}

    print(f"[SOLVER-GAMBIT] Global Power: {global_power}. Players: {players_list}")

    # --- Map current alliances ---
    initial_alliances_map: Dict[str, str] = {c: None for c in countries}
    for alliance_str in current_alliances:
        members = [m for m in alliance_str.split(" <-> ") if m in countries]
        if len(members) == 2:
            initial_alliances_map[members[0]] = members[1]
            initial_alliances_map[members[1]] = members[0]

    # --- ACTION SET CONSTRUCTION ---
    player_actions: Dict[str, List[str]] = {}
    for p in players_list:
        actions = ["Solo"]
        current_ally = initial_alliances_map.get(p)
        if current_ally and current_ally in players_list:
            actions.append(f"Ally_{current_ally}")
            
        others = [x for x in players_list if x != p and x != current_ally]
        others.sort(key=lambda x: abs(troop_ledger[x] - troop_ledger[p]))
        # Increase neighbor limit to 5 to allow more strategic flexibility
        for neighbor in others[:5]: # Burası önemli!!1
            actions.append(f"Ally_{neighbor}")
        player_actions[p] = actions

    tension_penalties: Dict[FrozenSet[str], int] = {}
    max_ww3_attempts = 5
    attempt = 0
    
    while attempt < max_ww3_attempts:
        attempt += 1
        print(f"[SOLVER-GAMBIT] Attempt {attempt}/5...")

        # 1. Create Gambit Game
        dimensions = [len(player_actions[p]) for p in players_list]
        game = pygambit.Game.new_table(dimensions)
        
        for i, p in enumerate(players_list):
            game.players[i].label = p
            for j, act in enumerate(player_actions[p]):
                game.players[i].strategies[j].label = act

        # 2. Populate Payoff Matrix
        # Iterate through all possible profiles
        strategy_ranges = [range(len(player_actions[p])) for p in players_list]
        hegemony_limit = global_power * 0.51
        print(f"[SOLVER-GAMBIT] Hegemony Limit (51%): {hegemony_limit}")

        for profile in itertools.product(*strategy_ranges):
            for i, p_idx in enumerate(profile):
                player_name = players_list[i]
                my_action = player_actions[player_name][p_idx]
                
                payoff = 0
                if "Ally_" in my_action:
                    target_name = my_action.replace("Ally_", "")
                    try:
                        target_idx = players_list.index(target_name)
                        target_action_idx = profile[target_idx]
                        target_action = player_actions[target_name][target_action_idx]
                        
                        if target_action == f"Ally_{player_name}":
                            combined_power = troop_ledger[player_name] + troop_ledger[target_name]
                            if combined_power > hegemony_limit:
                                payoff = -1000000
                            else:
                                payoff = 2000 # Increased base payoff
                                if initial_alliances_map.get(player_name) == target_name:
                                    payoff += 50000
                                power_diff = abs(troop_ledger[player_name] - troop_ledger[target_name])
                                synergy = 10000 // (1 + (power_diff // 1000)) # Increased synergy
                                payoff += synergy
                                pair_key = frozenset([player_name, target_name])
                                payoff -= tension_penalties.get(pair_key, 0)
                        else:
                            payoff = -500
                    except ValueError:
                        payoff = -500
                else:
                    # Solo Action
                    solo_key = frozenset([player_name])
                    payoff = 0 - tension_penalties.get(solo_key, 0)
                
                game[profile][game.players[i]] = int(payoff)

        # 3. Solve Nash Equilibrium
        try:
            res = pygambit.nash.enumpure_solve(game)
            if not res.equilibria:
                # If no pure Nash, try mixed strategies
                print("[SOLVER-GAMBIT] No pure Nash found, attempting mixed...")
                res = pygambit.nash.gnm_solve(game)
            
            if not res.equilibria:
                print("[SOLVER-GAMBIT] Critical Error: Failed to find any Nash Equilibrium.")
                break

            # Select the equilibrium with the highest social welfare (sum of payoffs)
            best_eq = None
            max_welfare = float('-inf')
            
            for eq in res.equilibria:
                current_welfare = 0
                # eq is a profile of strategy distributions
                # Calculate expected welfare for this equilibrium
                for i, p in enumerate(players_list):
                    # For pure Nash, this is just the payoff of the chosen strategy
                    strat_probs = [float(prob) for strat, prob in eq[game.players[i]]]
                    best_idx = np.argmax(strat_probs)
                    # We can't easily get the payoff from the game object without knowing others' actions
                    # But since it's a pure Nash, we can just use the indices
                    pass 
                
                # Simplified: Sum the payoffs of the pure strategies
                # To do this accurately for any EQ, we'd need to compute it from the table
                profile_indices = tuple(int(np.argmax([float(prob) for strat, prob in eq[game.players[i]]])) for i in range(len(players_list)))
                welfare = sum(int(game[profile_indices][game.players[i]]) for i in range(len(players_list)))
                
                if welfare > max_welfare:
                    max_welfare = welfare
                    best_eq = eq

            if not best_eq:
                print("[SOLVER-GAMBIT] Critical Error: Failed to find any Nash Equilibrium.")
                break

            eq = best_eq
            final_strategies = {}
            print(f"[SOLVER-GAMBIT] Final Strategies for Attempt {attempt} (Welfare: {max_welfare}):")
            for i, p in enumerate(players_list):
                strat_probs = [float(prob) for strat, prob in eq[game.players[i]]]
                best_strat_idx = np.argmax(strat_probs)
                final_strategies[p] = player_actions[p][best_strat_idx]
                print(f"  - {p}: {final_strategies[p]} (Probs: {strat_probs})")

            # 4. Compile Alliances
            current_contracts: List[AllianceContract] = []
            seen = set()
            cid = 0
            for p, act in final_strategies.items():
                if "Ally_" in act:
                    target = act.replace("Ally_", "")
                    if final_strategies.get(target) == f"Ally_{p}" and p not in seen:
                        cid += 1
                        ct = AllianceContract(cid)
                        ct.add_member(p)
                        ct.add_member(target)
                        current_contracts.append(ct)
                        seen.add(p)
                        seen.add(target)

            # 5. RULE 5: Power Balance Check (1.5x)
            # Treat each alliance and each solo country as a "Power Block"
            allied_countries = set()
            power_blocks = []
            block_to_key = {} 

            for ct in current_contracts:
                pwr = ct.get_power(troop_ledger)
                power_blocks.append(pwr)
                block_to_key[pwr] = frozenset(ct.members)
                for m in ct.members:
                    allied_countries.add(m)
            
            for p in players_list:
                if p not in allied_countries:
                    pwr = troop_ledger[p]
                    power_blocks.append(pwr)
                    block_to_key[pwr] = frozenset([p])

            if len(power_blocks) >= 2:
                # OPTIMIZATION: To prevent micro-nations from breaking all alliances, 
                # we ignore power blocks smaller than 10K for the MINIMUM reference in Rule 5.
                significant_blocks = [p for p in power_blocks if p >= 10000]
                if not significant_blocks: significant_blocks = power_blocks # Fallback
                
                max_p = max(power_blocks)
                min_p = min(significant_blocks)
                
                print(f"[SOLVER-GAMBIT] Power Blocks: {power_blocks} (Signif Min: {min_p})")
                if max_p > min_p * 1.5:
                    print(f"[SOLVER-GAMBIT] Balance Violated: {max_p} vs {min_p} ({max_p/min_p:.2f}x)")
                    strongest_key = block_to_key[max_p]
                    # Apply a smaller penalty to allow for more stable equilibria
                    tension_penalties[strongest_key] = tension_penalties.get(strongest_key, 0) + 3000
                    continue
            
            print(f"[SOLVER-GAMBIT] ✅ Nash Equilibrium Reached at Attempt {attempt}")
            resolved_alliances = [str(ct) for ct in current_contracts]
            ledger_changes = {}
            final_alliances_map = {c: None for c in countries}
            for ct in current_contracts:
                m = list(ct.members)
                final_alliances_map[m[0]] = m[1]
                final_alliances_map[m[1]] = m[0]

            for c in players_list:
                old = initial_alliances_map.get(c)
                new = final_alliances_map.get(c)
                if old != new:
                    change = 0
                    if old: change -= 2000
                    if new: change -= 2000
                    if change != 0:
                        ledger_changes[c] = change
            
            return resolved_alliances, ledger_changes

        except Exception as e:
            print(f"[SOLVER-GAMBIT] Solver error: {e}")
            break

    print("[SOLVER-GAMBIT] ⚠️ WORLD WAR 3: EQUILIBRIUM COLLAPSED")
    return ["WORLD WAR 3: EQUILIBRIUM COLLAPSED"], {}

