"""
Experiment 3 — Extensive form: propose partition, then sequential Accept/Reject.

Nigeria chooses partition index k in {0..51}. Egypt, South Africa, Kenya, and
Ethiopia each observe the proposal and play Accept or Reject in order.
Any Reject ends the game with a common disagreement payoff for everyone.
All Accept terminals assign compute_payoff payoffs for partition k.

Terminal nodes only realize partitions — no inconsistent normal-form cells.

Equilibrium enumeration on the reduced normal form of this tree can be very
slow; this script builds and summarizes the tree. To attempt Gambit PSNE on
the extensive game, set environment variable BLOCK3R_SOLVE_EFG=1 (may take a
long time or fail depending on pygambit version).

Requires pygambit extensive-game API (append_move / set_outcome).
"""

from __future__ import annotations

import os
import sys

import pygambit as gambit

from interfaces import Alliance, CountryName, HistoricalCountryData
from solver_helpers import (
    INCONSISTENT_PROFILE_PAYOFF,
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

VETO_CHAIN: list[CountryName] = ["Egypt", "South Africa", "Kenya", "Ethiopia"]


def build_proposal_veto_game() -> gambit.Game:
    profiles: list[list[Alliance]] = iter_mutual_consent_profiles(list(country_names))
    assert len(profiles) == 52

    g = gambit.Game.new_tree()
    g.title = "Proposal + sequential veto"

    ply: dict[CountryName, gambit.Player] = {}
    for nm in country_names:
        ply[nm] = g.add_player(nm)

    disagree = g.add_outcome(
        [INCONSISTENT_PROFILE_PAYOFF] * len(country_names),
        label="disagreement",
    )

    proposal_labels = [f"k{k}" for k in range(len(profiles))]
    g.append_move([g.root], ply["Nigeria"], proposal_labels)

    for k, start_node in enumerate(g.root.children):
        pay_vec = total_welfare_payoffs(country_names, profiles[k], countries)
        agree_outcome = g.add_outcome(list(pay_vec), label=f"partition_{k}")

        current = start_node
        for voter in VETO_CHAIN:
            g.append_move([current], ply[voter], ["Accept", "Reject"])
            reject_child = current.children[1]
            g.set_outcome(reject_child, disagree)
            current = current.children[0]

        g.set_outcome(current, agree_outcome)

    return g


def main() -> None:
    print_initial_country_data(countries)
    sys.stdout.flush()

    print_header("BUILD EXTENSIVE GAME")
    game = build_proposal_veto_game()
    print(f"Game title: {game.title}")
    print(f"Players (payoff order): {[p.label for p in game.players]}")
    print(f"Is tree: {game.is_tree}")
    print(f"Number of outcomes: {len(game.outcomes)}")
    node_list = list(game.nodes)
    print(f"Number of nodes: {len(node_list)}")
    sys.stdout.flush()

    print_header("SOLVE (PURE NASH - OPTIONAL, MAY BE SLOW)")
    try:
        result = gambit.nash.enumpure_solve(game)
        print(f"Pure strategy Nash equilibria found: {len(result.equilibria)}")
    except Exception as exc:
        print(f"enumpure_solve failed: {exc}")


if __name__ == "__main__":
    main()
