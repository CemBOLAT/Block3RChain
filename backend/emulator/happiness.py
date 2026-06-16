"""Happiness mechanics driven by tax rate (non-linear)."""

from __future__ import annotations

from emulator.ledger_types import LedgerSnapshot
from engine.game_parameters import GameParameters

PENALTY = 80
IMMEDIATE_SCALE = 50
DRIFT_RATE = 0.15
NEUTRAL_TAX = 1.0
HAPPINESS_MIN = 0
HAPPINESS_MAX = 100
DEFAULT_HAPPINESS = 75


def clamp_happiness(value: float) -> int:
    return int(round(max(HAPPINESS_MIN, min(HAPPINESS_MAX, value))))


def target_happiness(tax_rate: float) -> float:
    """Tax-implied equilibrium: neutral tax (1.0) → 100, extremes → lower."""
    deviation = tax_rate - NEUTRAL_TAX
    return HAPPINESS_MAX - PENALTY * (deviation**2)


def immediate_happiness_delta(old_rate: float, new_rate: float) -> float:
    """Quadratic penalty/reward on tax rate change."""
    delta_tax = new_rate - old_rate
    if delta_tax == 0:
        return 0.0
    sign = -1.0 if delta_tax > 0 else 1.0
    return sign * IMMEDIATE_SCALE * (abs(delta_tax) ** 2)


def apply_immediate_happiness_change(
    happiness_ledger: dict[str, int],
    country: str,
    old_rate: float,
    new_rate: float,
) -> None:
    current = float(happiness_ledger.get(country, DEFAULT_HAPPINESS))
    delta = immediate_happiness_delta(old_rate, new_rate)
    happiness_ledger[country] = clamp_happiness(current + delta)


def apply_happiness_drift(
    happiness_ledger: dict[str, int],
    tax_ledger: dict[str, float],
) -> None:
    """Move each country's happiness toward its tax-implied target."""
    for country in list(happiness_ledger.keys()):
        tax_rate = float(tax_ledger.get(country, NEUTRAL_TAX))
        current = float(happiness_ledger[country])
        target = target_happiness(tax_rate)
        happiness_ledger[country] = clamp_happiness(
            current + DRIFT_RATE * (target - current)
        )


def countries_below_happiness_limit(
    happiness_ledger: dict[str, int],
    game_parameters: GameParameters,
) -> list[str]:
    limit = game_parameters.happiness_limit
    return [
        country for country, happiness in happiness_ledger.items() if happiness < limit
    ]


def unhappiness_severity(happiness: int, limit: int) -> float:
    if limit <= 0 or happiness >= limit:
        return 0.0
    return (limit - happiness) / limit


def apply_unhappy_emigration(
    ledgers: LedgerSnapshot,
    game_parameters: GameParameters,
    log_node: str | None = None,
) -> dict[str, int]:
    """Per-block population loss when happiness is below the limit."""
    limit = game_parameters.happiness_limit
    rate = game_parameters.emigration_rate_per_block
    unhappy_emigration: dict[str, int] = {}

    countries = set(ledgers.pop.keys()) & set(ledgers.happiness.keys())
    for country in countries:
        happiness = int(ledgers.happiness.get(country, DEFAULT_HAPPINESS))
        if happiness >= limit:
            continue
        pop = int(ledgers.pop.get(country, 0))
        if pop <= 0:
            continue
        severity = unhappiness_severity(happiness, limit)
        loss = round(pop * severity * rate * 10)
        if loss == 0 and pop > 0:
            loss = 1
        loss = min(pop, loss)
        ledgers.pop[country] = pop - loss
        unhappy_emigration[country] = loss
        if log_node:
            print(
                f"[{log_node}] 🚶 {country}: {loss}M emigrated "
                f"(happiness={happiness}, limit={limit})"
            )

    return unhappy_emigration
