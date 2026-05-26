from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .dependencies import OrchestratorState


def country_exists(state: "OrchestratorState", country_id: str) -> bool:
    is_active = country_id in state.active_miners
    is_pending_add = any(
        i["type"] == "COUNTRY_ADD" and i["target"] == country_id
        for i in state.pending_interventions
    )
    is_pending_remove = any(
        i["type"] == "COUNTRY_REMOVE" and i["target"] == country_id
        for i in state.pending_interventions
    )
    return (is_active or is_pending_add) and not is_pending_remove


def effective_rivals(state: "OrchestratorState", country_id: str) -> list[str]:
    rivals = list(state.rival_ledger.get(country_id, []))
    for intervention in state.pending_interventions:
        if intervention.get("target") != country_id:
            continue
        if intervention.get("type") == "ADD_RIVAL":
            rival_id = intervention.get("rival_id")
            if rival_id and rival_id not in rivals:
                rivals.append(rival_id)
        elif intervention.get("type") == "REMOVE_RIVAL":
            rival_id = intervention.get("rival_id")
            if rival_id in rivals:
                rivals.remove(rival_id)
    return rivals

