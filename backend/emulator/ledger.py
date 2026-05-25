from emulator.ledger_types import LedgerDeltas, LedgerSnapshot


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
    current: LedgerSnapshot,
    preview: LedgerSnapshot,
    economic_deaths: dict[str, int] | None = None,
) -> LedgerDeltas:
    deaths = economic_deaths or {}
    return LedgerDeltas(
        troop=_ledger_field_updates(preview.troop, current.troop, preview_adjustment=deaths),
        gold=_ledger_field_updates(preview.gold, current.gold),
        pop=_ledger_field_updates(preview.pop, current.pop),
        castle={c: list(preview.castle.get(c, [])) for c in preview.castle},
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


def apply_economy(
    troop_ledger: dict,
    gold_ledger: dict,
    pop_ledger: dict,
    castle_ledger: dict | None = None,
    game_parameters=None,
    tax_ledger: dict | None = None,
    log_node: str | None = None,
) -> dict[str, int]:
    economic_deaths: dict[str, int] = {}
    castles = castle_ledger or {}
    taxes = tax_ledger or {}

    for country in list(troop_ledger.keys()):
        pop = int(pop_ledger.get(country, 0))
        troops = int(troop_ledger.get(country, 0))
        gold = int(gold_ledger.get(country, 0))

        # Tax rate: 0.0–1.0, default 1.0 (backward compat: 1M pop = 1K gold)
        tax_rate = float(taxes.get(country, 1.0))
        income = int(pop * 1000 * tax_rate)

        # Total castle maintenance expense
        castle_maint = 0
        if game_parameters is not None:
            for level in castles.get(country, []):
                castle_maint += game_parameters.castles[level].maintenance

        troop_upkeep = troops
        total_expense = troop_upkeep + castle_maint
        available = gold + income

        if available >= total_expense:
            # Happy path: pay everything
            gold_ledger[country] = available - total_expense
        else:
            # Crisis: smart prioritization
            lvls = castles.get(country, [])
            if game_parameters is not None and lvls:
                surviving, gold_left, deaths = _resolve_maintenance_crisis(
                    troops, gold, lvls, game_parameters, available
                )
            else:
                # No castles: simple troop reduction
                deficit = total_expense - available
                deaths = min(troops - 1, deficit)  # keep at least 1
                surviving = max(1, troops - deaths)
                gold_left = 0

            if deaths > 0:
                troop_ledger[country] = surviving
                economic_deaths[country] = -deaths
                gold_ledger[country] = 0
                if log_node:
                    print(
                        f"[{log_node}] 💀 {country}: crisis! "
                        f"{deaths} troops lost (gold={gold}, income={income}, "
                        f"expense={total_expense})"
                    )
            else:
                gold_ledger[country] = gold_left

    return economic_deaths



def update_ledger_of_country(
    troop_ledger: dict,
    gold_ledger: dict,
    pop_ledger: dict,
    intervention: dict,
) -> None:
    country = intervention["target"]
    troop_change = int(intervention.get("troop_change", 0))
    gold_change = int(intervention.get("gold_change", 0))
    pop_change = int(intervention.get("pop_change", 0))
    troop_ledger[country] = max(0, troop_ledger.get(country, 0) + troop_change)
    gold_ledger[country] = max(0, gold_ledger.get(country, 0) + gold_change)
    pop_ledger[country] = max(0, pop_ledger.get(country, 0) + pop_change)


def add_country_to_ledger(
    troop_ledger: dict,
    gold_ledger: dict,
    pop_ledger: dict,
    intervention: dict,
) -> None:
    country = intervention["target"]
    troop_ledger[country] = int(intervention.get("starting_troops", 10000))
    gold_ledger[country] = int(intervention.get("starting_gold", 5000))
    pop_ledger[country] = int(intervention.get("starting_population", 10))


def remove_country_from_ledger(
    troop_ledger: dict,
    gold_ledger: dict,
    pop_ledger: dict,
    country: str,
) -> None:
    troop_ledger.pop(country, None)
    gold_ledger.pop(country, None)
    pop_ledger.pop(country, None)
