# Block3RChain — Future Work

Backlog items agreed but not yet implemented. See also [SOLVER_REDESIGN.md](./SOLVER_REDESIGN.md) for the current hedonic solver design.

**Last updated:** 2026-05-20.

---

## FW-1: Economy affects alliance decisions

### Current behavior

- [`backend/engine/solver.py`](../backend/engine/solver.py) uses the **troop ledger only** when evaluating partitions.
- [`apply_economy`](../backend/emulator/ledger.py) runs in [`prepare_block_state`](../backend/emulator/mempool.py) before `calculate_alliances()`, so gold/population change troop counts via deaths and income, but **gold and population do not directly influence** whether a coalition is stable.

### Goal

Countries should not only survive via military balance (1.5× ratio rule) but also reflect economic health when choosing alliances — e.g. bankrupt or starving states are weaker or more eager to ally.

### Proposed directions (pick one or combine)

1. **Effective military power:** `power(country) = troops * f(gold, pop)` with caps/floors.
2. **Solvency penalty:** reduce `get_alliance_worth` for alliances with members below gold threshold.
3. **Separate threat:** economic collapse outcome (distinct from `NO_STABLE_PARTITION`) when too many countries have `economic_deaths` in one block.

### Touch points when implemented

| Area | Change |
|------|--------|
| `StrategicMilitarySim` | Accept gold/pop ledgers or derived effective power |
| `backend/engine/tests/test_solver.py` | Scenarios where economy changes alliance outcome |
| Frontend | Copy: “Alliances based on military and economic strength” |
| `docs/SOLVER_REDESIGN.md` | Document the chosen formula |

---

## FW-2: God-adjustable solver parameters

### Current behavior

`calculate_alliances()` already accepts optional parameters (defaults in code):

| Parameter | Default | Role |
|-----------|---------|------|
| `ratio_limit` | `1.5` | Max strongest/weakest alliance troop ratio |
| `alpha` | `0.10` | Fee scale vs alliance power |
| `beta` | `1.5` | Fee growth with alliance size |
| `epsilon_fraction` | `0.05` | Loyalty cushion (% of solo power) |

Miners call `calculate_alliances(troop, current_alliances)` with defaults only — the God user cannot tune the world.

### Goal

Let the operator adjust solver strictness and alliance size incentives from the UI (or per saved template) to get more diverse outcomes without code changes.

### Proposed implementation path

1. Store parameters on `OrchestratorState` (or simulation DB row).
2. Expose in God panel at equilibrium (sliders / numeric inputs with sane bounds).
3. Include in mempool metadata or pass via orchestrator config so all miners use the same values for a round.
4. No change to block wire format strictly required if all nodes read from gateway state before mining.

### Suggested bounds (for UI validation)

- `ratio_limit`: 1.2 – 3.0
- `alpha`: 0.05 – 0.25
- `beta`: 1.0 – 2.5
- `epsilon_fraction`: 0 – 0.15

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
