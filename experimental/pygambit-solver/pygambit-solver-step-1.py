"""
This script defines the raw action space for the alliance game.
Note: It focuses only on calculating possible strategy profiles and does not account for:
- Historical state: Previous alliances or existing relationships are ignored.
- Mutual consent: Alliance choices are unidirectional; Country A can choose an alliance 
  with Country B even if Country B does not choose to align with Country A.
"""
import itertools
import random
from solver_helpers import calculate_possible_alliances_for_country
from utils import (
    print_game_complexity,
    print_header,
    print_initial_country_data,
)

countries = {
    "Nigeria": {"troop_count": 1000},
    "Egypt": {"troop_count": 800},
    "South Africa": {"troop_count": 600},
    "Kenya": {"troop_count": 400},
    "Ethiopia": {"troop_count": 500}
}
country_names = list(countries.keys())

print_initial_country_data(countries)

print_header("POSSIBLE ACTIONS PER COUNTRY")
country_actions = {}
for country in country_names:
    country_alliances = calculate_possible_alliances_for_country(country, country_names)
    country_actions[country] = country_alliances
    print(f"{country} ({len(country_alliances)} possible actions)")

strategy_profiles = list(itertools.product(*country_actions.values()))
print_game_complexity(country_actions)

# Pick and print a random strategy profile
random_profile = random.choice(strategy_profiles)
print_header("RANDOM STRATEGY PROFILE")
for i, country in enumerate(country_names):
    chosen_alliance = random_profile[i]
    troop_payoff = sum(countries[member]["troop_count"] for member in chosen_alliance if member != country)
    
    alliance_str = ", ".join(chosen_alliance)
    print(f"{country:15}: {alliance_str:35} - Troop Payoff: {troop_payoff}")

