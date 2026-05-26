"""Tests for happiness mechanics."""

from emulator.happiness import (
    apply_happiness_drift,
    apply_immediate_happiness_change,
    apply_unhappy_emigration,
    clamp_happiness,
    countries_below_happiness_limit,
    immediate_happiness_delta,
    target_happiness,
    unhappiness_severity,
)
from emulator.ledger import copy_ledger_snapshot
from emulator.ledger_types import LedgerSnapshot
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


def _ledger(pop: int, happiness: int, tax: float = 1.0) -> LedgerSnapshot:
    return LedgerSnapshot(
        troop={"A": 1000},
        gold={"A": 5000},
        pop={"A": pop},
        castle={"A": []},
        tax={"A": tax},
        happiness={"A": happiness},
    )


def test_unhappiness_severity_strictly_below_limit():
    assert unhappiness_severity(30, 30) == 0.0
    assert unhappiness_severity(50, 50) == 0.0
    assert unhappiness_severity(25, 50) == 0.5


def test_no_emigration_when_at_or_above_limit():
    gp = GameParameters(happiness_limit=30, emigration_rate_per_block=0.5)
    ledgers = copy_ledger_snapshot(_ledger(pop=100, happiness=30))
    assert apply_unhappy_emigration(ledgers, gp) == {}
    assert ledgers.pop["A"] == 100

    ledgers = copy_ledger_snapshot(_ledger(pop=100, happiness=40))
    assert apply_unhappy_emigration(ledgers, gp) == {}
    assert ledgers.pop["A"] == 100


def test_emigration_minimum_one_million_when_unhappy():
    gp = GameParameters(happiness_limit=50, emigration_rate_per_block=0.02)
    ledgers = copy_ledger_snapshot(_ledger(pop=59, happiness=24))
    loss = apply_unhappy_emigration(ledgers, gp)["A"]
    assert loss == 1
    assert ledgers.pop["A"] == 58


def test_emigration_scales_with_severity():
    gp = GameParameters(happiness_limit=50, emigration_rate_per_block=0.1)
    mild = copy_ledger_snapshot(_ledger(pop=100, happiness=45))
    severe = copy_ledger_snapshot(_ledger(pop=100, happiness=20))
    mild_loss = apply_unhappy_emigration(mild, gp)["A"]
    severe_loss = apply_unhappy_emigration(severe, gp)["A"]
    assert mild_loss < severe_loss
    assert severe_loss == 6
    assert mild_loss == 1


def test_emigration_caps_at_current_population():
    gp = GameParameters(happiness_limit=50, emigration_rate_per_block=1.0)
    ledgers = copy_ledger_snapshot(_ledger(pop=5, happiness=0))
    loss = apply_unhappy_emigration(ledgers, gp)["A"]
    assert loss == 5
    assert ledgers.pop["A"] == 0
    assert ledgers.pop["A"] >= 0


def test_prepare_block_state_records_unhappy_emigration():
    from emulator.mempool import prepare_block_state
    from emulator.ledger_types import MempoolSnapshot
    from engine.alliance_parameters import AllianceParameters
    from engine.constants import DEFAULT_ALLIANCE_PARAMETERS

    ledgers = LedgerSnapshot(
        troop={"A": 2000, "B": 2000},
        gold={"A": 10000, "B": 10000},
        pop={"A": 50, "B": 100},
        castle={"A": [], "B": []},
        tax={"A": 1.0, "B": 1.0},
        happiness={"A": 75, "B": 20},
    )
    gp = GameParameters(happiness_limit=50, emigration_rate_per_block=0.05)
    snapshot = MempoolSnapshot(
        mempool={"phase": 1, "interventions": [], "base_reward": 1000},
        previous_hash="abc",
        index_to_mine=1,
        phase=1,
        base_reward=1000,
        ledgers=ledgers,
        current_alliances=[],
        alliance_parameters=AllianceParameters.model_validate(DEFAULT_ALLIANCE_PARAMETERS),
        game_parameters=gp,
    )
    state = prepare_block_state(snapshot, "A")
    assert "B" in state.unhappy_emigration
    assert state.unhappy_emigration["B"] > 0
    assert state.deltas.pop["B"] == -state.unhappy_emigration["B"]
    assert "A" not in state.unhappy_emigration
