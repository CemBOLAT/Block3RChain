"""
Experiment 2 — Choosing a partition directly.

A full simultaneous game where each of 5 players picks one of Bell(n) partition
indices would need 52^5 cells — too large for Gambit. This script therefore:

  A) Single-decision-maker proxy: one player with 52 strategies (partition IDs).
     Payoff per strategy = sum of all countries' compute_payoff under that
     partition (total welfare). Gambit finds the welfare-maximizing partition.

  B) Unanimous coordination (Python only): each player names an index k in
     {0..51}. If all match, payoffs come from that partition; otherwise all
     get INCONSISTENT_PROFILE_PAYOFF. We verify numerically that every unanimous
     profile is a pure Nash equilibrium (52 of them), without building 52^5.
"""

import pygambit as gambit

from interfaces import Alliance, CountryName, HistoricalCountryData
from solver_helpers import (
    INCONSISTENT_PROFILE_PAYOFF,
    compute_payoff,
    iter_mutual_consent_profiles,
    total_welfare_payoffs,
)
from utils import print_header, print_initial_country_data

country_names: list[CountryName] = [
    "Nigeria",
    "Egypt",
    "South Africa",
    "Kenya",
    "Ethiopia",
]

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


def payoffs_partition_choice(indices: list[int], profiles: list[list[Alliance]]) -> list[int]:
    """Simultaneous partition-index game: unanimous -> partition payoffs; else penalty."""
    if len(set(indices)) != 1:
        return [INCONSISTENT_PROFILE_PAYOFF] * len(country_names)
    k = indices[0]
    return total_welfare_payoffs(country_names, profiles[k], countries)


def verify_unanimous_pure_nash(profiles: list[list[Alliance]]) -> None:
    """Each player i deviates from unanimous k to every other index."""
    n_p = len(profiles)
    assert n_p == 52
    for k in range(n_p):
        base = payoffs_partition_choice([k] * 5, profiles)
        for i in range(5):
            for alt in range(n_p):
                if alt == k:
                    continue
                dev = [k] * 5
                dev[i] = alt
                got = payoffs_partition_choice(dev, profiles)
                assert got[i] <= base[i], (k, i, alt, base[i], got[i])
    print(
        "Sanity check passed: no single-country deviation improves payoff "
        "from any unanimous partition profile (assuming penalty dominates)."
    )


print_initial_country_data(countries)

partition_profiles = iter_mutual_consent_profiles(list(country_names))

print_header("PART A — SINGLE PLAYER / TOTAL WELFARE (52 STRATEGIES)")
print(
    "One fictional player chooses partition ID 0..51.\n"
    "Payoff = sum over countries of compute_payoff in that partition.\n"
)

welfare_by_k: list[int] = []
for k, alliances in enumerate(partition_profiles):
    total = sum(
        compute_payoff(country_names[i], alliances[i], countries)
        for i in range(len(country_names))
    )
    welfare_by_k.append(total)

g = gambit.Game.new_table([len(partition_profiles)])
g.title = "Partition choice - total welfare"
mechanism = g.players[0]
mechanism.label = "Mechanism"
for k in range(len(partition_profiles)):
    mechanism.strategies[k].label = f"partition_{k}"

for k, w in enumerate(welfare_by_k):
    g[[k]][mechanism] = w

result = gambit.nash.enumpure_solve(g)
best_k = max(range(len(welfare_by_k)), key=lambda k: welfare_by_k[k])
print(f"Welfare-maximizing partition index (brute): k={best_k}, sum_payoffs={welfare_by_k[best_k]}")
print(f"Gambit pure equilibria ({len(result.equilibria)}):")
for ei, eq in enumerate(result.equilibria):
    played = [(s.label, float(eq[s])) for s in mechanism.strategies if float(eq[s]) > 1e-6]
    print(f"  EQ {ei + 1}: {played}")

print_header("PART B — UNANIMOUS COORDINATION (PYTHON ONLY)")
print(
    "Five players each choose k in {0..51}. Payoffs equal partition k iff all agree;\n"
    "otherwise everyone receives INCONSISTENT_PROFILE_PAYOFF.\n"
    "Full normal form would have 52^5 outcomes — not built here.\n"
)
verify_unanimous_pure_nash(partition_profiles)
print(
    f"There are {len(partition_profiles)} unanimous pure-strategy Nash profiles "
    "(one per common partition index k)."
)
