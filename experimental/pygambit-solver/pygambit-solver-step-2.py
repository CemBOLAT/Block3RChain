"""
This script extends the alliance game logic by incorporating historical state.
Key features:
- Action Space: Calculates possible strategy profiles for the country set.
- Historical State: Accounts for existing relationships; troop payoffs now reflect
  the net change (strength of new partners minus strength of abandoned previous partners).
- Mutual Consent: Choices remain unidirectional (Country A can choose Country B regardless
  of Country B's choice).
"""

import itertools
import random
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

all_alliances = calculate_all_possible_alliances(country_names)

country_actions = {}
for country in country_names:
    country_alliances = [a for a in all_alliances if country in a]
    country_actions[country] = country_alliances

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

    # Troops gained from partners in the NEW alliance
    gained_troops = sum(
        countries[member]["troop_count"]
        for member in chosen_alliance
        if member != country
    )

    # Troops lost from PREVIOUS alliance partners
    lost_troops = sum(
        countries[prev_member]["troop_count"]
        for prev_member in countries[country]["previous_alliances"]
    )

    troop_payoff = gained_troops - lost_troops
    alliance_str = ", ".join(chosen_alliance)
    print(f"{country:15}: {alliance_str:35} - Troop Payoff: {troop_payoff}")
