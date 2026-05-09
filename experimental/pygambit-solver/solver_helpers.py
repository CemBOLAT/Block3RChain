import itertools
from collections.abc import Mapping, Sequence

from interfaces import Alliance, CountryName, HistoricalCountryData


def calculate_possible_alliances_for_country(
    country: CountryName, countries_list: Sequence[CountryName]
) -> list[Alliance]:
    other_countries = [c for c in countries_list if c != country]
    alliances: list[Alliance] = []
    for r in range(len(other_countries) + 1):
        for combo in itertools.combinations(other_countries, r):
            alliances.append([country, *combo])
    return alliances


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
