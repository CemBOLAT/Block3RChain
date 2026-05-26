# Block3RChain — Future Work

Backlog items agreed but not yet implemented. See also [SOLVER_REDESIGN.md](./SOLVER_REDESIGN.md) for the hedonic solver design.

**Last updated:** 2026-05-26.

---

## FW-1: Economy affects alliance decisions (partial)

### Current behavior (2026-05-26)

- [`backend/engine/solver.py`](../backend/engine/solver.py) uses **troop attack power** and **defense power** (troops + per-member castle bonuses from [`game_parameters`](../backend/engine/game_parameters.py)).
- [`apply_economy`](../backend/emulator/ledger.py) runs before alliances; tax rates scale gold income; castle upkeep can force troop deaths or castle demolition.
- [`happiness.py`](../backend/emulator/happiness.py) can shrink population via emigration when happiness is below `game_parameters.happiness_limit`, indirectly reducing future income and military pressure.
- **Gold and population still do not directly enter** the stability / exploitation checks — only troops, castles, and alliance fee parameters matter for coalition choice.

### Goal

Countries should reflect economic health when choosing alliances — e.g. bankrupt or starving states are weaker or more eager to ally, beyond the indirect troop/pop pathways above.

### Proposed directions (pick one or combine)

1. **Effective military power:** `power(country) = troops * f(gold, pop)` with caps/floors.
2. **Solvency penalty:** reduce `get_alliance_worth` for alliances with members below gold threshold.
3. **Separate threat:** economic collapse outcome (distinct from `NO_STABLE_PARTITION`) when too many countries have `economic_deaths` or `unhappy_emigration` in one block.

### Touch points when implemented

| Area | Change |
|------|--------|
| `StrategicMilitarySim` | Accept gold/pop ledgers or derived effective power |
| `backend/engine/tests/test_solver.py` | Scenarios where economy changes alliance outcome |
| Frontend | Copy: “Alliances based on military and economic strength” |
| `docs/SOLVER_REDESIGN.md` | Document the chosen formula |

---

## FW-2: God-adjustable solver parameters — **done**

Implemented 2026-05-26.

| Piece | Location |
|-------|----------|
| `AllianceParameters` model | `backend/engine/alliance_parameters.py` |
| Orchestrator + mempool broadcast | `backend/api/orchestrator.py`, `backend/api/routers/miner.py` |
| Config API (equilibrium only) | `POST /api/simulation/{id}/config/alliance_parameters` |
| UI | `AllianceConfigPanel` → `AllianceParametersForm` |

Parameters: `ratio_limit`, `alpha`, `beta`, `epsilon_fraction`, `strategy`. Miners read values from the gateway mempool snapshot each round.

**Related (also done):** `GameParameters` (block reward, castle costs/defense, happiness limit, emigration rate) via `POST .../config/game_parameters` and `GameParametersForm`.

---

## FW-3: HAPPY_WORLD terminal state (deferred)

Grand-coalition peace when no multipolar partition exists but everyone prefers unity. Code is **commented out** in `solver.py`; UI and `AllianceOutcome.HAPPY_WORLD` were removed from the active path. See SOLVER_REDESIGN.md Q5.

---

## FW-4: API / orchestrator simplification (optional)

- `alliance_winner`, `PipelinePhase.PHASE_2` / `PHASE_3`, and `acknowledgements` reflect an older multi-phase design. Production uses **phase 1 only** and `action_winner`. Consider removing dead fields after a migration pass.
- Expose solver reject reasons in `mempool.data` for block history (“rejected: imbalance 3.2x”).

---

## FW-5: Nash-style stability (optional)

Extend individual rationality to “would country i prefer another bloc in this partition?” — not only solo defection. Documented in SOLVER_REDESIGN.md as a stretch item.

---

## FW-6: Persist config on simulation templates (optional)

Alliance and game parameters can be set at runtime and on simulation **start** (`SimulationConfig` in `schemas.py`), but template rows in PostgreSQL may not yet store per-template defaults. Wire DB columns or JSON config if templates should remember operator tuning.
