"""
List every alliance profile that satisfies *strong mutual consent*:

  For all distinct players i, j: if country j is in i's declared alliance,
  then j's declared member set must equal i's (same coalition for everyone
  who names anyone else).

For n labeled countries, such outcomes are in bijection with *set partitions*
of those n countries. The count is the Bell number Bell(n).

  Bell(5) = 52   vs   Cartesian product size = 16^5 = 1,048,576

So 52 is "small" because the constraint collapses joint announcements to a
partition — almost all independent combinations violate agreement.

Helpers live in solver_helpers.py.
"""

from __future__ import annotations

import itertools

from interfaces import Alliance, CountryName
from solver_helpers import (
    calculate_possible_alliances_for_country,
    iter_mutual_consent_profiles,
    profile_has_mutual_consent,
)

# Same order as pygambit-solver-step-4.py (dict insertion order).
COUNTRY_NAMES: list[CountryName] = [
    "Nigeria",
    "Egypt",
    "South Africa",
    "Kenya",
    "Ethiopia",
]


def main() -> None:
    country_actions = {
        c: calculate_possible_alliances_for_country(c, COUNTRY_NAMES)
        for c in COUNTRY_NAMES
    }
    n_actions = [len(country_actions[c]) for c in COUNTRY_NAMES]
    cartesian_size = 1
    for n in n_actions:
        cartesian_size *= n

    profiles = iter_mutual_consent_profiles(COUNTRY_NAMES)

    print("Countries:", ", ".join(COUNTRY_NAMES))
    print(f"Strategies per country: {n_actions} -> product = {cartesian_size:,} profiles")
    print(f"Bell({len(COUNTRY_NAMES)}) = {len(profiles)} consistent profiles (strong mutual consent)\n")

    for k, alliances in enumerate(profiles, start=1):
        print(f"--- Consistent profile {k}/{len(profiles)} ---")
        for name, alliance in zip(COUNTRY_NAMES, alliances, strict=True):
            print(f"  {name}: {', '.join(alliance)}")
        assert profile_has_mutual_consent(COUNTRY_NAMES, alliances)
        print()

    brute = 0
    for tup in itertools.product(*[range(n) for n in n_actions]):
        per_player = [
            country_actions[COUNTRY_NAMES[i]][tup[i]] for i in range(len(COUNTRY_NAMES))
        ]
        if profile_has_mutual_consent(COUNTRY_NAMES, per_player):
            brute += 1
    print(f"Brute-force count over full product (verification): {brute}")
    assert brute == len(profiles)


if __name__ == "__main__":
    main()
