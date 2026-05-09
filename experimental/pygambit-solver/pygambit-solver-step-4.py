import itertools
import time
import pygambit as gambit
from interfaces import Alliance, CountryName, HistoricalCountryData
from solver_helpers import (
    calculate_possible_alliances_for_country,
    compute_payoff,
)
from utils import (
    print_game_complexity,
    print_header,
    print_initial_country_data,
)

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

print_initial_country_data(countries)

# --- Build action space ---
country_actions: dict[CountryName, list[Alliance]] = {
    country: calculate_possible_alliances_for_country(country, country_names)
    for country in country_names
}
n_actions: list[int] = [len(actions) for actions in country_actions.values()]
total_profiles: int = print_game_complexity(country_actions)


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
        payoff = compute_payoff(country, chosen_alliance, countries)
        g[list(profile_indices)][g.players[i]] = payoff
print("Payoff table filled.")

print_header("NASH EQUILIBRIA")
print("Solving for pure strategy Nash Equilibria (enumpure_solve)...")
start: float = time.time()
result = gambit.nash.enumpure_solve(g)
elapsed: float = time.time() - start
print(f"Computation took: {elapsed:.2f}s")
equilibria = result.equilibria
print(f"Found {len(equilibria)} pure strategy Nash Equilibrium(a).")

for eq_idx, eq in enumerate(equilibria):
    print(f"\nEquilibrium {eq_idx + 1}:")
    for player in g.players:
        played: list[tuple[CountryName, float]] = [
            (s.label, float(eq[s])) for s in player.strategies if float(eq[s]) > 1e-6
        ]
        print(f"  {player.label}:")
        for label, prob in played:
            print(f"    [{prob:.4f}] {label}")
