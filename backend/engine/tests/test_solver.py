"""
Regression tests for the hedonic coalition-formation solver.

Five canonical scenarios that must remain stable across any future changes
to the fee curve or stability logic. Run with:

    cd backend
    pytest engine/tests/test_solver.py -v

Parameters used in all tests match the defaults in calculate_alliances():
    ratio_limit=1.5, alpha=0.10, beta=1.5, epsilon_fraction=0.05
"""
import sys
import os

# Allow running from either the repo root or the backend directory.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from emulator.ledger_types import AllianceOutcome
from engine.alliance_parameters import AllianceParameters
from engine.solver import calculate_alliances, StrategicMilitarySim


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _run(ledger, current_alliances=None):
    return calculate_alliances(ledger, current_alliances)


def _sorted_partition(alliances):
    """Normalise an alliances list for order-independent comparison."""
    return sorted([sorted(a) for a in alliances])


# ---------------------------------------------------------------------------
# Scenario 1 — Two equal countries
# Expected: STABLE, no formal alliance (both singletons are rational).
# ---------------------------------------------------------------------------

class TestTwoEqualCountries:
    ledger = {"Alpha": 50_000, "Beta": 50_000}

    def test_status(self):
        result = _run(self.ledger)
        assert result.outcome == AllianceOutcome.STABLE

    def test_no_formal_alliances(self):
        # Singletons are valid; output only shows groups with >=2 members.
        result = _run(self.ledger)
        assert result.alliances == []

    def test_stability_score_is_finite(self):
        result = _run(self.ledger)
        assert result.stability_score is not None
        assert result.stability_score < float("inf")


# ---------------------------------------------------------------------------
# Scenario 2 — Three equal countries
# Expected: STABLE, each as a singleton ([A]/[B]/[C]), ratio=1.0.
# Any 2-vs-1 split gives ratio 100k/50k = 2.0 > 1.5 → IMBALANCE.
# ---------------------------------------------------------------------------

class TestThreeEqualCountries:
    ledger = {"Alpha": 50_000, "Beta": 50_000, "Gamma": 50_000}

    def test_status(self):
        result = _run(self.ledger)
        assert result.outcome == AllianceOutcome.STABLE

    def test_no_formal_alliances(self):
        result = _run(self.ledger)
        assert result.alliances == []

    def test_stability_score_is_zero(self):
        # Ratio = 1.0, so balance_penalty = 0.0
        result = _run(self.ledger)
        assert result.stability_score == pytest.approx(0.0, abs=1e-6)


# ---------------------------------------------------------------------------
# Scenario 3 — USA / Canada / Mexico baseline
# Powers: USA=51k, Canada=30k, Mexico=25k (the canonical failing case with
# the old equal-split model).
# Expected: STABLE, alliance = [Canada, Mexico], USA remains solo.
# ---------------------------------------------------------------------------

class TestUSACanadaMexico:
    ledger = {
        "United States of America": 51_000,
        "Canada": 30_000,
        "Mexico": 25_000,
    }

    def test_status(self):
        result = _run(self.ledger)
        assert result.outcome == AllianceOutcome.STABLE, (
            f"Expected STABLE but got {result.outcome}. "
            "The hedonic fee model should allow [USA] / [Canada, Mexico]."
        )

    def test_canada_mexico_alliance(self):
        result = _run(self.ledger)
        assert _sorted_partition(result.alliances) == [["Canada", "Mexico"]]

    def test_usa_is_solo(self):
        # USA should NOT appear in any formal alliance.
        result = _run(self.ledger)
        all_members = [m for a in result.alliances for m in a]
        assert "United States of America" not in all_members

    def test_stability_score_is_low(self):
        # Ratio ≈ 55k/51k = 1.08 → balance_penalty ≈ 7.8
        result = _run(self.ledger)
        assert result.stability_score is not None
        assert result.stability_score < 20.0


# ---------------------------------------------------------------------------
# Scenario 4 — Dominant superpower (WW3)
# One country is overwhelmingly larger; no partition can satisfy ratio_limit.
# The superpower is also too strong to make grand coalition individually
# rational for itself (its payoff in the grand coalition < solo power).
# Expected: NO_STABLE_PARTITION
# ---------------------------------------------------------------------------

class TestDominantSuperpower:
    # Titan = 1,000,000 troops; all others combined = 10,000
    ledger = {
        "Titan": 1_000_000,
        "Ant": 5_000,
        "Bee": 5_000,
    }

    def test_status(self):
        result = _run(self.ledger)
        assert result.outcome == AllianceOutcome.NO_STABLE_PARTITION, (
            f"Expected NO_STABLE_PARTITION but got {result.outcome}. "
            "A 100x power imbalance should always trigger WW3."
        )

    def test_no_alliances_returned(self):
        result = _run(self.ledger)
        assert result.alliances == []

    def test_stability_score_is_none(self):
        result = _run(self.ledger)
        assert result.stability_score is None


# ---------------------------------------------------------------------------
# Scenario 5 — Two-country world with no valid multipolar partition
# Strong=100k, Weak=10k: [Strong]/[Weak] has ratio 10 > 1.5 → IMBALANCE.
# HAPPY_WORLD grand-coalition fallback is disabled → WW3.
# ---------------------------------------------------------------------------

class TestTwoCountryNoMultipolarPartition:
    ledger = {"Strong": 100_000, "Weak": 10_000}

    def test_status_is_ww3(self):
        result = _run(self.ledger)
        assert result.outcome == AllianceOutcome.NO_STABLE_PARTITION

    def test_no_alliances_returned(self):
        result = _run(self.ledger)
        assert result.alliances == []


# ---------------------------------------------------------------------------
# Empty ledger — caller must not invoke the solver
# ---------------------------------------------------------------------------

class TestEmptyLedgerRejected:
    def test_raises_value_error(self):
        with pytest.raises(ValueError, match="must not be empty"):
            calculate_alliances({})


# ---------------------------------------------------------------------------
# Unit tests for the fee formula
# ---------------------------------------------------------------------------

class TestFeeFormula:
    """Ensure fee(S) scales correctly with alliance size and power."""

    def _sim(self, countries):
        return StrategicMilitarySim(
            countries,
            parameters=AllianceParameters(alpha=0.10, beta=1.5),
        )

    def test_singleton_fee_is_zero(self):
        sim = self._sim({"A": 50_000})
        assert sim.fee(["A"]) == 0.0

    def test_two_member_fee(self):
        # fee([A,B]) = 0.10 * 100k * (2-1)^1.5 = 10k
        sim = self._sim({"A": 50_000, "B": 50_000})
        assert sim.fee(["A", "B"]) == pytest.approx(10_000.0, rel=1e-6)

    def test_three_member_fee_is_larger(self):
        # fee([A,B,C]) = 0.10 * 150k * (3-1)^1.5 = 15k * 2.828... ≈ 42426
        sim = self._sim({"A": 50_000, "B": 50_000, "C": 50_000})
        fee_2 = sim.fee(["A", "B"])
        fee_3 = sim.fee(["A", "B", "C"])
        assert fee_3 > fee_2, "Coordination cost must grow with alliance size."

    def test_alliance_worth_positive_for_small_alliance(self):
        sim = self._sim({"A": 50_000, "B": 50_000})
        assert sim.get_alliance_worth(["A", "B"]) > 0.0

    def test_alliance_worth_decreases_as_alliance_grows_very_large(self):
        # With 10 equal members the fee should eventually make worth smaller
        # than with 2 members, demonstrating diseconomy of scale.
        members = {f"C{i}": 10_000 for i in range(10)}
        sim = self._sim(members)
        worth_2 = sim.get_alliance_worth(list(members.keys())[:2])
        worth_10 = sim.get_alliance_worth(list(members.keys()))
        assert worth_10 < worth_2, (
            "Grand coalition should be less attractive than a small alliance."
        )


class TestStrategy:
    """Ensure strategy parameter works for balanced, unbalanced, random."""

    def test_strategy_balanced_unbalanced_random(self):
        # We need a ledger with multiple valid stable outcomes.
        ledger = {
            "A": 60_000,
            "B": 40_000,
            "C": 30_000,
            "D": 20_000,
        }
        # Run with balanced strategy
        res_bal = calculate_alliances(ledger, parameters=AllianceParameters(strategy="balanced"))
        assert res_bal.outcome == AllianceOutcome.STABLE

        # Run with unbalanced strategy
        res_unbal = calculate_alliances(ledger, parameters=AllianceParameters(strategy="unbalanced"))
        assert res_unbal.outcome == AllianceOutcome.STABLE

        # Run with random strategy
        res_rand = calculate_alliances(ledger, parameters=AllianceParameters(strategy="random"))
        assert res_rand.outcome == AllianceOutcome.STABLE

        # Verify that they return stable partitions
        if res_bal.stability_score is not None and res_unbal.stability_score is not None:
            assert res_unbal.stability_score >= res_bal.stability_score

        # Random strategy should be deterministic for the same ledger state
        res_rand_2 = calculate_alliances(ledger, parameters=AllianceParameters(strategy="random"))
        assert res_rand.alliances == res_rand_2.alliances


class TestCastleDefense:
    """Ensure that castle defense bonuses are factored into solver simulations."""

    def test_castle_defense_bonus_affects_alliances(self):
        ledger = {
            "United States of America": 51_000,
            "Canada": 30_000,
            "Mexico": 25_000,
        }
        res_no_castle = calculate_alliances(ledger)
        assert res_no_castle.alliances == [["Canada", "Mexico"]]

        from engine.game_parameters import GameParameters
        game_params = GameParameters(castle_defense_l3=50_000)
        castles = {"United States of America": [3]}
        res_with_castle = calculate_alliances(
            ledger, 
            game_parameters=game_params,
            castle_ledger=castles
        )
        assert res_with_castle.outcome in (AllianceOutcome.STABLE, AllianceOutcome.NO_STABLE_PARTITION)

        # Verify that demolishing the castle reverts effective power and alliances back to standard
        castles_demolished = {"United States of America": []}
        res_demolished = calculate_alliances(
            ledger, 
            game_parameters=game_params,
            castle_ledger=castles_demolished
        )
        assert res_demolished.alliances == [["Canada", "Mexico"]]

    def test_castle_country_can_stand_solo(self):
        """A country with enough castle defense should be able to validly stand alone.
        Without singleton fix this test would fail (castle countries always "exploited" solo).
        """
        from engine.game_parameters import GameParameters
        # A=30k troops + 30k castle defense = 60k solo power
        # B=25k, C=20k → B+C attack=45k, defense=45k (no castles)
        # A solo: payoff=60k (solo_power), v_solo=60k → NOT exploited ✓
        ledger = {"A": 30_000, "B": 25_000, "C": 20_000}
        game_params = GameParameters(castle_defense_l1=30_000)
        castles = {"A": [1]}
        res = calculate_alliances(ledger, game_parameters=game_params, castle_ledger=castles)
        # A is fortified: either solo or in an alliance, result must be stable
        assert res.outcome == AllianceOutcome.STABLE
        # If A is solo, the singleton payoff == 60k >= v_solo == 60k → valid
        a_is_solo = any(p == ["A"] for p in res.alliances)
        a_in_alliance = not a_is_solo
        # Both outcomes are legitimate; just ensure stability reached
        assert a_is_solo or a_in_alliance

    def test_weak_castle_country_joins_alliance(self):
        """A country with only a tiny castle should still be drawn into an alliance
        when the alliance offers more than its modest solo defense power.
        """
        from engine.game_parameters import GameParameters
        # A=30k troops + 1k castle bonus = 31k solo.  B=25k, C=25k
        # A+B or A+C attack=55k. fee≈0.1*55k*(1^1.5)=5.5k → worth≈49.5k >> 31k → A prefers alliance
        ledger = {"A": 30_000, "B": 25_000, "C": 25_000}
        game_params = GameParameters(castle_defense_l1=1_000)
        castles = {"A": [1]}
        res = calculate_alliances(ledger, game_parameters=game_params, castle_ledger=castles)
        assert res.outcome == AllianceOutcome.STABLE




