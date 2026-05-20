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
        return StrategicMilitarySim(countries, alpha=0.10, beta=1.5)

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
