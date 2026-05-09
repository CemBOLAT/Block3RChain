"""
Experiment 1 — Normal form with full Cartesian product.

Every player picks an alliance subset (16 strategies each → 16^5 profiles).
Payoffs use compute_payoff only when the joint profile satisfies strong mutual
consent; otherwise every player gets INCONSISTENT_PROFILE_PAYOFF.

enumpure_solve lists all pure Nash equilibria; inconsistent profiles can still
be equilibria (penalty sink). We therefore print only equilibria whose pure
strategy profile passes profile_has_mutual_consent, capped for readability.
"""

import itertools
import time
import pygambit as gambit
from interfaces import Alliance, CountryName, HistoricalCountryData
from solver_helpers import (
    INCONSISTENT_PROFILE_PAYOFF,
    alliances_from_strategy_indices,
    calculate_possible_alliances_for_country,
    compute_payoff,
    profile_has_mutual_consent,
)
from utils import (
    print_game_complexity,
    print_header,
    print_initial_country_data,
)

MAX_DISPLAY_CONSISTENT_EQUILIBRIA = 55

countries: dict[str, HistoricalCountryData] = {
    "Nigeria": {
        "troop_count": 1000,
        "previous_alliances": ["Egypt", "South Africa"],
    },
    "Egypt": {
        "troop_count": 800,
        "previous_alliances": ["Nigeria", "South Africa"],
    },
    "South Africa": {"troop_count": 600, "previous_alliances": ["Nigeria", "Egypt"]},
    "Kenya": {"troop_count": 400, "previous_alliances": []},
    "Ethiopia": {"troop_count": 500, "previous_alliances": []},
}
country_names: list[CountryName] = list(countries.keys())


def _pure_strategy_indices(eq, players) -> list[int] | None:
    indices: list[int] = []
    for player in players:
        chosen = [j for j, s in enumerate(player.strategies) if float(eq[s]) > 1e-6]
        if len(chosen) != 1:
            return None
        indices.append(chosen[0])
    return indices


print_initial_country_data(countries)

country_actions: dict[CountryName, list[Alliance]] = {
    country: calculate_possible_alliances_for_country(country, country_names)
    for country in country_names
}
n_actions: list[int] = [len(actions) for actions in country_actions.values()]
total_profiles: int = print_game_complexity(country_actions)

print_header("BUILDING PYGAMBIT GAME (PENALTY FOR INCONSISTENT PROFILES)")
g = gambit.Game.new_table(n_actions)
g.title = "Alliance Formation Game (strong consent + penalty)"

for i, country in enumerate(country_names):
    g.players[i].label = country
    for j, alliance in enumerate(country_actions[country]):
        g.players[i].strategies[j].label = ", ".join(alliance)

print(f"Players: {[p.label for p in g.players]}")
print(f"Game table size: {n_actions} -> {total_profiles:,} profiles")

print("Filling payoffs (consent-aware)...")
fill_start: float = time.time()
n_countries = len(country_names)
consistent_cell_count: int = 0
for profile_indices in itertools.product(*[range(n) for n in n_actions]):
    profile_list = list(profile_indices)
    alliances_per_player: list[Alliance] = [
        country_actions[country_names[i]][profile_indices[i]] for i in range(n_countries)
    ]
    if profile_has_mutual_consent(country_names, alliances_per_player):
        consistent_cell_count += 1
        for i in range(n_countries):
            g[profile_list][g.players[i]] = compute_payoff(
                country_names[i], alliances_per_player[i], countries
            )
    else:
        for i in range(n_countries):
            g[profile_list][g.players[i]] = INCONSISTENT_PROFILE_PAYOFF
print(
    f"Payoff table filled in {time.time() - fill_start:.2f}s. "
    f"Consistent cells: {consistent_cell_count:,} / {total_profiles:,}"
)

print_header("NASH EQUILIBRIA (PURE)")
print("Solving for pure strategy Nash Equilibria (enumpure_solve)...")
start: float = time.time()
result = gambit.nash.enumpure_solve(g)
elapsed: float = time.time() - start
print(f"Computation took: {elapsed:.2f}s")
equilibria = result.equilibria
print(f"Found {len(equilibria)} pure strategy Nash equilibrium(a) total.")

consistent_equilibria: list = []
for eq in equilibria:
    idx = _pure_strategy_indices(eq, g.players)
    if idx is None:
        continue
    alliances_profile = alliances_from_strategy_indices(
        country_names, country_actions, idx
    )
    if profile_has_mutual_consent(country_names, alliances_profile):
        consistent_equilibria.append(eq)

print(
    f"Equilibria with mutually consistent alliances: {len(consistent_equilibria)} "
    f"(printing up to {MAX_DISPLAY_CONSISTENT_EQUILIBRIA})"
)

display_n = min(MAX_DISPLAY_CONSISTENT_EQUILIBRIA, len(consistent_equilibria))
for eq_idx, eq in enumerate(consistent_equilibria[:display_n]):
    print(f"\nEquilibrium {eq_idx + 1}:")
    for player in g.players:
        played: list[tuple[CountryName, float]] = [
            (s.label, float(eq[s])) for s in player.strategies if float(eq[s]) > 1e-6
        ]
        print(f"  {player.label}:")
        for label, prob in played:
            print(f"    [{prob:.4f}] {label}")

if len(consistent_equilibria) > display_n:
    print(f"\n... omitted {len(consistent_equilibria) - display_n} further consistent equilibria.")
