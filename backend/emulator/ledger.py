import copy

from engine.game_parameters import GameParameters
from emulator.happiness import (
    DEFAULT_HAPPINESS,
    apply_immediate_happiness_change,
    clamp_happiness,
)
from emulator.ledger_types import LedgerDeltas, LedgerSnapshot


def copy_ledger_snapshot(source: LedgerSnapshot) -> LedgerSnapshot:
    return LedgerSnapshot(
        troop=dict(source.troop),
        gold=dict(source.gold),
        pop=dict(source.pop),
        castle=copy.deepcopy(source.castle),
        tax=dict(source.tax),
        happiness=dict(source.happiness),
        rival=copy.deepcopy(source.rival),
    )


def _ledger_field_updates(
    preview: dict,
    current: dict,
    *,
    preview_adjustment: dict[str, int] | None = None,
) -> dict[str, int]:
    adjustment = preview_adjustment or {}
    updates: dict[str, int] = {}
    for country in preview:
        new_value = int(preview[country]) + adjustment.get(country, 0)
        old_value = int(current.get(country, 0))
        if new_value != old_value:
            updates[country] = new_value - old_value
    return updates


def compute_ledger_deltas(
    preview: LedgerSnapshot,
    current: LedgerSnapshot,
    economic_deaths: dict[str, int] | None = None,
) -> LedgerDeltas:
    deaths = economic_deaths or {}
    return LedgerDeltas(
        troop=_ledger_field_updates(
            preview.troop, current.troop, preview_adjustment=deaths
        ),
        gold=_ledger_field_updates(preview.gold, current.gold),
        pop=_ledger_field_updates(preview.pop, current.pop),
        castle={c: list(preview.castle.get(c, [])) for c in preview.castle},
        happiness=_ledger_field_updates(preview.happiness, current.happiness),
    )


def _castle_efficiency(level: int, gp) -> tuple[float, int, int]:
    """Returns (defense_per_gold, defense_bonus, maintenance_cost) for a castle level."""
    castle = gp.castles[level]
    d, m = castle.defense, castle.maintenance
    return (d / m if m > 0 else float("inf"), d, m)


def _resolve_maintenance_crisis(
    troops: int,
    gold: int,
    castle_levels: list,
    gp,
    available: int,
) -> tuple[int, int, int]:
    """
    When available gold < total expenses, prioritize by defense-per-gold efficiency.
    Castles (typically 10-12 def/gold) beat troops (1 def/gold), so pay castles first.

    Returns: (surviving_troops, gold_left, troop_deaths)
    """
    # Sort castle levels by efficiency descending
    sorted_castles = sorted(
        castle_levels,
        key=lambda lvl: _castle_efficiency(lvl, gp)[0],
        reverse=True,
    )

    remaining = available
    # Pay castles from most to least efficient
    for lvl in sorted_castles:
        _, _, maint = _castle_efficiency(lvl, gp)
        if remaining >= maint:
            remaining -= maint
        # If can't afford: skip this castle's maintenance.
        # The unpaid cost is implicitly covered by troop reduction below.

    # Remaining budget covers troop upkeep (1 troop = 1 gold/tick)
    troop_upkeep = troops
    if remaining >= troop_upkeep:
        return troops, remaining - troop_upkeep, 0
    else:
        deaths = troop_upkeep - remaining
        # Always keep at least 1 troop
        surviving = max(1, troops - deaths)
        actual_deaths = troops - surviving
        return surviving, 0, actual_deaths


def calculate_expenses(
    troops: int,
    castle_levels: list[int],
    game_parameters: GameParameters,
) -> int:
    castle_maint = sum(
        game_parameters.castles[level].maintenance for level in castle_levels
    )
    return troops + castle_maint


def apply_economy(
    ledgers: LedgerSnapshot,
    game_parameters: GameParameters,
    log_node: str | None = None,
) -> dict[str, int]:
    economic_deaths: dict[str, int] = {}

    for country in list(ledgers.troop.keys()):
        pop = int(ledgers.pop.get(country, 0))
        troops = int(ledgers.troop.get(country, 0))
        gold = int(ledgers.gold.get(country, 0))

        tax_rate = float(ledgers.tax.get(country, 1.0))
        income = int(pop * 1000 * tax_rate)
        available = gold + income

        total_expense = calculate_expenses(
            troops, ledgers.castle.get(country, []), game_parameters
        )

        if available >= total_expense:
            ledgers.gold[country] = available - total_expense
        else:
            lvls = ledgers.castle.get(country, [])
            if lvls:
                surviving, gold_left, deaths = _resolve_maintenance_crisis(
                    troops, gold, lvls, game_parameters, available
                )
            else:
                deficit = total_expense - available
                deaths = min(troops - 1, deficit)
                surviving = max(1, troops - deaths)
                gold_left = 0

            if deaths > 0:
                ledgers.troop[country] = surviving
                economic_deaths[country] = -deaths
                ledgers.gold[country] = 0
                if log_node:
                    print(
                        f"[{log_node}] 💀 {country}: crisis! "
                        f"{deaths} troops lost (gold={gold}, income={income}, "
                        f"expense={total_expense})"
                    )
            else:
                ledgers.gold[country] = gold_left

    return economic_deaths


def update_ledger_of_country(ledgers: LedgerSnapshot, intervention: dict) -> None:
    country = intervention["target"]
    troop_change = int(intervention.get("troop_change", 0))
    gold_change = int(intervention.get("gold_change", 0))
    pop_change = int(intervention.get("pop_change", 0))
    ledgers.troop[country] = max(0, ledgers.troop.get(country, 0) + troop_change)
    ledgers.gold[country] = max(0, ledgers.gold.get(country, 0) + gold_change)
    ledgers.pop[country] = max(0, ledgers.pop.get(country, 0) + pop_change)


def add_country_to_ledger(ledgers: LedgerSnapshot, intervention: dict) -> None:
    country = intervention["target"]
    ledgers.troop[country] = int(intervention.get("starting_troops", 10000))
    ledgers.gold[country] = int(intervention.get("starting_gold", 5000))
    ledgers.pop[country] = int(intervention.get("starting_population", 10))
    ledgers.castle[country] = []
    ledgers.tax[country] = 1.0
    ledgers.happiness[country] = clamp_happiness(
        float(intervention.get("starting_happiness", DEFAULT_HAPPINESS))
    )
    ledgers.rival[country] = []


def remove_country_from_ledger(ledgers: LedgerSnapshot, country: str) -> None:
    ledgers.troop.pop(country, None)
    ledgers.gold.pop(country, None)
    ledgers.pop.pop(country, None)
    ledgers.castle.pop(country, None)
    ledgers.tax.pop(country, None)
    ledgers.happiness.pop(country, None)
    ledgers.rival.pop(country, None)
    for rivals in ledgers.rival.values():
        if country in rivals:
            rivals.remove(country)


def add_rival_to_ledger(ledgers: LedgerSnapshot, intervention: dict) -> None:
    country = intervention["target"]
    rival_id = intervention["rival_id"]
    rivals = ledgers.rival.setdefault(country, [])
    if rival_id not in rivals:
        rivals.append(rival_id)


def remove_rival_from_ledger(ledgers: LedgerSnapshot, intervention: dict) -> None:
    country = intervention["target"]
    rival_id = intervention["rival_id"]
    rivals = ledgers.rival.get(country, [])
    if rival_id in rivals:
        rivals.remove(rival_id)


def apply_interventions(
    ledgers: LedgerSnapshot,
    interventions: list,
    game_parameters: GameParameters,
) -> None:
    for intervention in interventions:
        i_type = intervention.get("type", "")
        i_target = intervention.get("target")
        if "GOD_INTERVENTION" in i_type:
            update_ledger_of_country(ledgers, intervention)
        elif "COUNTRY_ADD" in i_type:
            add_country_to_ledger(ledgers, intervention)
        elif "COUNTRY_REMOVE" in i_type:
            remove_country_from_ledger(ledgers, i_target)
        elif "BUILD_CASTLE" in i_type:
            level = int(intervention.get("level", 1))
            cost = game_parameters.castles[level].build_cost
            ledgers.gold[i_target] = max(0, ledgers.gold.get(i_target, 0) - cost)
            if i_target not in ledgers.castle:
                ledgers.castle[i_target] = []
            ledgers.castle[i_target].append(level)
        elif "DEMOLISH_CASTLE" in i_type:
            level = int(intervention.get("level", 1))
            if i_target in ledgers.castle and level in ledgers.castle[i_target]:
                ledgers.castle[i_target].remove(level)
        elif "SET_TAX_RATE" in i_type:
            old_rate = float(ledgers.tax.get(i_target, 1.0))
            new_rate = max(0.0, min(2.0, float(intervention.get("tax_rate", 1.0))))
            ledgers.tax[i_target] = new_rate
            apply_immediate_happiness_change(
                ledgers.happiness, i_target, old_rate, new_rate
            )
        elif "ADD_RIVAL" in i_type:
            add_rival_to_ledger(ledgers, intervention)
        elif "REMOVE_RIVAL" in i_type:
            remove_rival_from_ledger(ledgers, intervention)
