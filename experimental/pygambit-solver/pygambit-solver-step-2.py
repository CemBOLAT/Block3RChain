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
from solver_helpers import calculate_possible_alliances_for_country
from utils import (
    print_game_complexity,
    print_header,
    print_initial_country_data,
)

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

print_initial_country_data(countries)

country_actions = {
    country: calculate_possible_alliances_for_country(country, country_names)
    for country in country_names
}

strategy_profiles = list(itertools.product(*country_actions.values()))
print_game_complexity(country_actions)

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
