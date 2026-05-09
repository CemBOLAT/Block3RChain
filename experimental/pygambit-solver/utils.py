from collections.abc import Mapping
from math import prod

from interfaces import Alliance, CountryName, PrintableCountryData


def print_header(title: str, width: int = 40) -> None:
    print("\n" + "=" * width)
    print(title.center(width))
    print("=" * width)


def print_initial_country_data(countries: Mapping[CountryName, PrintableCountryData]) -> None:
    print_header("INITIAL COUNTRY DATA")
    for country, data in countries.items():
        line = f"{country:15}: Troops = {data['troop_count']}"
        if "previous_alliances" in data:
            line += f" | Previous Alliances = {data['previous_alliances']}"
        print(line)


def print_game_complexity(
    country_actions: Mapping[CountryName, list[Alliance]],
) -> int:
    n_actions = [len(actions) for actions in country_actions.values()]
    total_profiles = prod(n_actions) if n_actions else 0

    print_header("GAME COMPLEXITY")
    print(f"Number of countries: {len(country_actions)}")
    print(f"Actions per country: {n_actions[0] if n_actions else 0}")
    print(f"Total possible strategy profiles: {total_profiles:,}")

    return total_profiles
