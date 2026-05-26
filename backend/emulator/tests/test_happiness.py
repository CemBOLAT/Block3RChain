"""Tests for happiness mechanics."""

from emulator.happiness import (
    apply_happiness_drift,
    apply_immediate_happiness_change,
    clamp_happiness,
    countries_below_happiness_limit,
    immediate_happiness_delta,
    target_happiness,
)
from engine.game_parameters import GameParameters


def test_immediate_delta_is_quadratic_in_tax_change():
    small = abs(immediate_happiness_delta(1.0, 1.1))
    large = abs(immediate_happiness_delta(1.0, 2.0))
    assert large > small * 5


def test_immediate_delta_sign_follows_tax_direction():
    assert immediate_happiness_delta(1.0, 1.5) < 0
    assert immediate_happiness_delta(1.5, 1.0) > 0


def test_apply_immediate_happiness_change_clamps():
    ledger = {"A": 5}
    apply_immediate_happiness_change(ledger, "A", 1.0, 2.0)
    assert ledger["A"] == 0


def test_target_happiness_neutral_tax_is_max():
    assert target_happiness(1.0) == 100


def test_target_happiness_extreme_tax_is_lower():
    assert target_happiness(2.0) < target_happiness(1.0)
    assert target_happiness(0.0) < target_happiness(1.0)


def test_drift_moves_toward_target():
    ledger = {"A": 50}
    tax = {"A": 2.0}
    apply_happiness_drift(ledger, tax)
    assert ledger["A"] < 50


def test_clamp_happiness_bounds():
    assert clamp_happiness(-10) == 0
    assert clamp_happiness(150) == 100


def test_countries_below_happiness_limit():
    gp = GameParameters(happiness_limit=30)
    ledger = {"A": 25, "B": 40, "C": 30}
    assert countries_below_happiness_limit(ledger, gp) == ["A"]


def test_compute_ledger_deltas_includes_happiness():
    from emulator.ledger import compute_ledger_deltas
    from emulator.ledger_types import LedgerSnapshot

    current = LedgerSnapshot(
        troop={"A": 1}, gold={}, pop={}, castle={}, tax={}, happiness={"A": 80}
    )
    preview = LedgerSnapshot(
        troop={"A": 1}, gold={}, pop={}, castle={}, tax={}, happiness={"A": 65}
    )
    deltas = compute_ledger_deltas(preview, current)
    assert deltas.happiness == {"A": -15}


def test_set_tax_rate_produces_happiness_delta():
    from emulator.ledger import (
        apply_interventions,
        compute_ledger_deltas,
        copy_ledger_snapshot,
    )
    from emulator.happiness import apply_happiness_drift
    from emulator.ledger_types import LedgerSnapshot
    from engine.game_parameters import GameParameters

    current = LedgerSnapshot(
        troop={"Central African Rep.": 2000},
        gold={"Central African Rep.": 6000},
        pop={"Central African Rep.": 5},
        castle={"Central African Rep.": []},
        tax={"Central African Rep.": 1.0},
        happiness={"Central African Rep.": 75},
    )
    working = copy_ledger_snapshot(current)
    apply_interventions(
        working,
        [
            {
                "type": "SET_TAX_RATE",
                "target": "Central African Rep.",
                "tax_rate": 2.0,
            }
        ],
        GameParameters(),
    )
    apply_happiness_drift(working.happiness, working.tax)
    deltas = compute_ledger_deltas(working, current)
    assert deltas.happiness.get("Central African Rep.", 0) < 0
