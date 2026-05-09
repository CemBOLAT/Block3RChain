import itertools
from collections.abc import Mapping, Sequence

from interfaces import Alliance, CountryName, HistoricalCountryData

# Must dominate any feasible compute_payoff so inconsistent profiles are worse.
INCONSISTENT_PROFILE_PAYOFF: int = -(10**9)


def calculate_possible_alliances_for_country(
    country: CountryName, countries_list: Sequence[CountryName]
) -> list[Alliance]:
    other_countries = [c for c in countries_list if c != country]
    alliances: list[Alliance] = []
    for r in range(len(other_countries) + 1):
        for combo in itertools.combinations(other_countries, r):
            alliances.append([country, *combo])
    return alliances


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


def alliance_from_block_membership(
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
        alliance_from_block_membership(
            country_names[i], block_by_country[country_names[i]], country_names
        )
        for i in range(len(country_names))
    ]


def iter_mutual_consent_profiles(
    country_names: list[CountryName],
) -> list[list[Alliance]]:
    """Enumerate strong-consent alliance profiles (Bell(n) many)."""
    out: list[list[Alliance]] = []
    for blocks in partitions(list(country_names)):
        out.append(alliances_from_set_partition(country_names, blocks))
    return out


def alliances_from_strategy_indices(
    country_names: Sequence[CountryName],
    country_actions: Mapping[CountryName, Sequence[Alliance]],
    profile_indices: Sequence[int],
) -> list[Alliance]:
    return [
        country_actions[country_names[i]][profile_indices[i]]
        for i in range(len(country_names))
    ]


def player_payoff_at_profile(
    country_names: Sequence[CountryName],
    alliances_per_player: Sequence[Alliance],
    countries: Mapping[CountryName, HistoricalCountryData],
    player_index: int,
) -> int:
    if not profile_has_mutual_consent(country_names, alliances_per_player):
        return INCONSISTENT_PROFILE_PAYOFF
    return compute_payoff(
        country_names[player_index],
        alliances_per_player[player_index],
        countries,
    )


def compute_payoff(
    country: CountryName,
    chosen_alliance: Alliance,
    countries: Mapping[CountryName, HistoricalCountryData],
) -> int:
    gained: int = sum(
        countries[member]["troop_count"]
        for member in chosen_alliance
        if member != country
    )
    lost: int = sum(
        countries[prev]["troop_count"]
        for prev in countries[country]["previous_alliances"]
    )
    return gained - lost


def total_welfare_payoffs(
    country_names: Sequence[CountryName],
    alliances_per_player: Sequence[Alliance],
    countries: Mapping[CountryName, HistoricalCountryData],
) -> list[int]:
    """Per-player payoffs for a consistent partition profile."""
    return [
        compute_payoff(country_names[i], alliances_per_player[i], countries)
        for i in range(len(country_names))
    ]
