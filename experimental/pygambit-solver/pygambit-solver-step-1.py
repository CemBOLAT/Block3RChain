"""
This script defines the raw action space for the alliance game.
Note: It focuses only on calculating possible strategy profiles and does not account for:
- Historical state: Previous alliances or existing relationships are ignored.
- Mutual consent: Alliance choices are unidirectional; Country A can choose an alliance 
  with Country B even if Country B does not choose to align with Country A.
"""
import itertools
import random
from utils import calculate_all_possible_alliances, print_header

countries = {
    "Nigeria": {"troop_count": 1000},
    "Egypt": {"troop_count": 800},
    "South Africa": {"troop_count": 600},
    "Kenya": {"troop_count": 400},
    "Ethiopia": {"troop_count": 500}
}
country_names = list(countries.keys())

print_header("INITIAL COUNTRY DATA")
for country, data in countries.items():
    print(f"{country:15}: Troops = {data['troop_count']}")

all_alliances = calculate_all_possible_alliances(country_names)

print_header("POSSIBLE ACTIONS PER COUNTRY")
country_actions = {}
for country in country_names:
    country_alliances = [a for a in all_alliances if country in a]
    country_actions[country] = country_alliances
    print(f"{country} ({len(country_alliances)} possible actions)")

strategy_profiles = list(itertools.product(*country_actions.values()))

print_header("GAME COMPLEXITY")
print(f"Number of countries: {len(country_names)}")
print(f"Actions per country: {len(next(iter(country_actions.values())))}")
print(f"Total possible strategy profiles: {len(strategy_profiles):,}")

# Pick and print a random strategy profile
random_profile = random.choice(strategy_profiles)
print_header("RANDOM STRATEGY PROFILE")
for i, country in enumerate(country_names):
    chosen_alliance = random_profile[i]
    troop_payoff = sum(countries[member]["troop_count"] for member in chosen_alliance if member != country)
    
    alliance_str = ", ".join(chosen_alliance)
    print(f"{country:15}: {alliance_str:35} - Troop Payoff: {troop_payoff}")

