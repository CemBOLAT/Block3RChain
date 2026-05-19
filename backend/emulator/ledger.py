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
    )


def apply_economy(
    troop_ledger: dict,
    gold_ledger: dict,
    pop_ledger: dict,
    log_node: str | None = None,
) -> dict[str, int]:
    economic_deaths: dict[str, int] = {}
    for country in list(troop_ledger.keys()):
        pop = int(pop_ledger.get(country, 0))
        troops = int(troop_ledger.get(country, 0))
        gold = int(gold_ledger.get(country, 0))

        income = pop * 1000
        expense = troops
        gold += income - expense

        if gold < 0:
            deaths = abs(gold)
            troop_ledger[country] = max(0, troops - deaths)
            economic_deaths[country] = deaths
            gold = 0
            if log_node:
                print(f"[{log_node}] 💀 {country} could not pay {deaths} soldiers. They have died.")

        gold_ledger[country] = max(0, gold)
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
