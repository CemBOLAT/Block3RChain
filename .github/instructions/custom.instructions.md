# Block3RChain — Agent Instructions (Current)

> **Note:** Older versions of this file described a 15-step, three-block PuLP pipeline. That design is **obsolete**. Use the sources below for the live system.

## Authoritative docs

- [README.md](../../README.md) — architecture, run instructions, solver API
- [.github/skills/implement-simulation-pipeline/SKILL.md](../skills/implement-simulation-pipeline/SKILL.md) — god queue, mempool, miners, consensus
- [docs/SOLVER_REDESIGN.md](../../docs/SOLVER_REDESIGN.md) — hedonic alliance solver
- [docs/FUTURE_WORK.md](../../docs/FUTURE_WORK.md) — planned features

## Production pipeline (summary)

1. **Equilibrium (`step === 0`):** God queues interventions via map (left-click form) or context menu; optional config panel for alliance/game parameters; pending list in sidebar.
2. **Commit:** `POST .../god/commit` → mempool `{ interventions, phase: 1, base_reward }` (`base_reward` from `game_parameters.block_reward`), `step = 1`.
3. **Mining:** Each node previews block (interventions → economy → happiness drift → emigration → `calculate_alliances(troop, castle, …, alliance_parameters, game_parameters)`) and races PoW; gossip stops peers after first valid hash.
4. **Consensus:** First `POST .../miner/submit` wins; gateway relays winner ledgers (troop, gold, pop, castle, tax, happiness), appends block, `step` returns to `0`.

Alliance solver: `backend/engine/solver.py` — hedonic model with castle defense; outcomes `STABLE` | `NO_STABLE_PARTITION`. Parameters tunable via `POST .../config/alliance_parameters`. Not PuLP / not e-Core equal-split.

## God intervention surface

- **Map left-click:** `NationActionMenu` — troop/gold/pop deltas or add country.
- **Map right-click:** `MapContextMenu` — presets, castle build/demolish, tax rate.
- **Sidebar:** intervention queue + commit (no duplicate form in God panel).
- **Config panel (top-right):** `AllianceConfigPanel` — alliance solver + game parameters at equilibrium.

## When editing

- Do not assume 15 steps, `alliance_winner` for phase 3, or `EMPTY_LEDGER` solver status.
- Empty troop ledger: do not call `calculate_alliances` (raises `ValueError`); guard in `mempool.py`.
- Block `data` includes `castle_ledger_updates`, `happiness_ledger_updates`, and `unhappy_emigration` — keep frontend types in sync.
