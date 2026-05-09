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

"""

from __future__ import annotations

import itertools
from collections.abc import Sequence

from interfaces import Alliance, CountryName
from solver_helpers import calculate_possible_alliances_for_country


# Same order as pygambit-solver-step-4.py (dict insertion order).
COUNTRY_NAMES: list[CountryName] = [
    "Nigeria",
    "Egypt",
    "South Africa",
    "Kenya",
    "Ethiopia",
]


def profile_has_mutual_consent(
    country_names: Sequence[CountryName],
    alliances_per_player: Sequence[Alliance],
) -> bool:
    if len(country_names) != len(alliances_per_player):
        return False
    sets = [frozenset(a) for a in alliances_per_player]
    for i, _ in enumerate(country_names):
        for j, name_j in enumerate(country_names):
            if i == j:
                continue
            if name_j in sets[i] and sets[j] != sets[i]:
                return False
    return True


def partitions(xs: list[CountryName]) -> list[list[list[CountryName]]]:
    """All set partitions of xs (each partition is a list of disjoint blocks)."""
    if len(xs) == 1:
        return [[xs]]
    first, *rest = xs
    out: list[list[list[CountryName]]] = []
    for smaller in partitions(rest):
        for i in range(len(smaller)):
            block = [first, *smaller[i]]
            out.append(smaller[:i] + [block] + smaller[i + 1 :])
        out.append([[first]] + smaller)
    return out


def alliance_from_block(
    country: CountryName,
    block: frozenset[CountryName],
    country_names: Sequence[CountryName],
) -> Alliance:
    """Same ordering convention as calculate_possible_alliances_for_country."""
    others = sorted(
        (c for c in block if c != country),
        key=lambda x: list(country_names).index(x),
    )
    return [country, *others]


def alliances_from_set_partition(
    country_names: Sequence[CountryName],
    blocks: Sequence[Sequence[CountryName]],
) -> list[Alliance]:
    block_by_country: dict[CountryName, frozenset[CountryName]] = {}
    for block in blocks:
        b = frozenset(block)
        for c in b:
            block_by_country[c] = b
    return [
        alliance_from_block(country_names[i], block_by_country[country_names[i]], country_names)
        for i in range(len(country_names))
    ]


def iter_consistent_profiles_via_partitions(
    country_names: list[CountryName],
) -> list[list[Alliance]]:
    """Enumerate consistent profiles (Bell(n) items)."""
    out: list[list[Alliance]] = []
    for blocks in partitions(list(country_names)):
        out.append(alliances_from_set_partition(country_names, blocks))
    return out


def main() -> None:
    country_actions = {
        c: calculate_possible_alliances_for_country(c, COUNTRY_NAMES)
        for c in COUNTRY_NAMES
    }
    n_actions = [len(country_actions[c]) for c in COUNTRY_NAMES]
    cartesian_size = 1
    for n in n_actions:
        cartesian_size *= n

    profiles = iter_consistent_profiles_via_partitions(COUNTRY_NAMES)

    print("Countries (same as step-4):", ", ".join(COUNTRY_NAMES))
    print(f"Strategies per country: {n_actions} -> product = {cartesian_size:,} profiles")
    print(f"Bell({len(COUNTRY_NAMES)}) = {len(profiles)} consistent profiles (strong mutual consent)\n")

    for k, alliances in enumerate(profiles, start=1):
        print(f"--- Consistent profile {k}/{len(profiles)} ---")
        for name, alliance in zip(COUNTRY_NAMES, alliances, strict=True):
            print(f"  {name}: {', '.join(alliance)}")
        assert profile_has_mutual_consent(COUNTRY_NAMES, alliances)
        print()

    # Optional brute-force check (same count as partition enumeration).
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
