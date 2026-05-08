"""
This script builds on step-2 by constructing a formal pygambit Game object
from the alliance action space and payoff structure, then solving for Nash Equilibria.

Key features:
- Action Space: Each country's set of possible alliances becomes their strategy set.
- Payoffs: Net troop payoff (gained from new partners - lost from abandoned previous partners).
- Solver: Uses pygambit's support_enumeration solver, which is robust for N-player games.

Note: Mutual consent is still unidirectional.
"""

import itertools
import time
import pygambit as gambit
from utils import calculate_all_possible_alliances, print_header

countries = {
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
country_names = list(countries.keys())

print_header("INITIAL COUNTRY DATA")
for country, data in countries.items():
    print(
        f"{country:15}: Troops = {data['troop_count']} | Previous Alliances = {data['previous_alliances']}"
    )

# --- Build action space ---
all_alliances = calculate_all_possible_alliances(country_names)
country_actions = {}
for country in country_names:
    country_alliances = [a for a in all_alliances if country in a]
    country_actions[country] = country_alliances

n_actions = [len(actions) for actions in country_actions.values()]

print_header("GAME COMPLEXITY")
print(f"Number of countries: {len(country_names)}")
print(f"Actions per country: {n_actions[0]}")
total_profiles = 1
for n in n_actions:
    total_profiles *= n
print(f"Total possible strategy profiles: {total_profiles:,}")


# --- Define payoff function ---
def compute_payoff(country, chosen_alliance):
    """Net troop payoff for a country given its chosen alliance."""
    gained = sum(
        countries[member]["troop_count"]
        for member in chosen_alliance
        if member != country
    )
    lost = sum(
        countries[prev]["troop_count"]
        for prev in countries[country]["previous_alliances"]
    )
    return gained - lost


# --- Build pygambit Game ---
print_header("BUILDING PYGAMBIT GAME")
g = gambit.Game.new_table(n_actions)
g.title = "Alliance Formation Game"

# Label players and their strategies
for i, country in enumerate(country_names):
    g.players[i].label = country
    for j, alliance in enumerate(country_actions[country]):
        g.players[i].strategies[j].label = ", ".join(alliance)

print(f"Players: {[p.label for p in g.players]}")
print(f"Game table size: {n_actions} -> {total_profiles:,} profiles")

# Fill in payoffs for every strategy profile
print("Filling in payoffs for every strategy profile...")
for profile_indices in itertools.product(*[range(n) for n in n_actions]):
    for i, country in enumerate(country_names):
        chosen_alliance = country_actions[country][profile_indices[i]]
        payoff = compute_payoff(country, chosen_alliance)
        g[list(profile_indices)][g.players[i]] = payoff
print("Payoff table filled.")

print_header("NASH EQUILIBRIA")
print("Solving for pure strategy Nash Equilibria (enumpure_solve)...")
start = time.time()
result = gambit.nash.enumpure_solve(g)
elapsed = time.time() - start
print(f"Computation took: {elapsed:.2f}s")
equilibria = result.equilibria
print(f"Found {len(equilibria)} pure strategy Nash Equilibrium(a).")

for eq_idx, eq in enumerate(equilibria):
    print(f"\nEquilibrium {eq_idx + 1}:")
    for player in g.players:
        played = [
            (s.label, float(eq[s])) for s in player.strategies if float(eq[s]) > 1e-6
        ]
        print(f"  {player.label}:")
        for label, prob in played:
            print(f"    [{prob:.4f}] {label}")
