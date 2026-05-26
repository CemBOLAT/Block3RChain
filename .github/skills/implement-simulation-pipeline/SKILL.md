---
name: implement-simulation-pipeline
description: 'Use when implementing, debugging, or extending the God-Mode blockchain simulation pipeline: batched interventions, PoW mining, hedonic alliance solver, happiness/castles, and WebSocket state sync.'
argument-hint: 'Which part of the pipeline are you working on (god queue, mempool, miners, solver, config, frontend)?'
user-invocable: true
disable-model-invocation: false
---

# Block3RChain Simulation Pipeline

Guidance for working on the **current** God-Mode pipeline. The production path is a **single-block commit** per intervention batch, not a 15-step multi-phase chain.

## When to Use

- Editing FastAPI orchestration (`backend/api/orchestrator.py`, `routers/god.py`, `routers/miner.py`, `routers/config.py`).
- Editing miner emulation (`backend/emulator/nodes.py`, `mining.py`, `mempool.py`, `ledger.py`, `happiness.py`).
- Changing alliance logic (`backend/engine/solver.py`, `alliance_parameters.py`, `game_parameters.py`).
- Debugging consensus, ledger drift, or frontend state (`frontend/src/store/useSimulationStore.ts`).

## Orchestrator State (`OrchestratorState`)

| Field | Role |
|-------|------|
| `step` | `0` = equilibrium; `1` = mining active; briefly `4` on finalize |
| `pending_interventions` | Queue at equilibrium; cleared when commit builds mempool |
| `current_mempool` | Active block template: `interventions`, `phase`, `base_reward`; later `data` from winner |
| `troop_ledger` / `gold_ledger` / `pop_ledger` / `castle_ledger` / `tax_ledger` / `happiness_ledger` | World state |
| `alliances` | Multi-member groups from last winning block |
| `alliance_parameters` / `game_parameters` | Solver + game rules; broadcast to miners and WebSocket |
| `active_miners` | Countries allowed to submit blocks |

## End-to-End Flow

### 1. Equilibrium — queue (step 0)

God endpoints (`/api/simulation/{id}/god/...`):

- `POST /intervention` → `GOD_INTERVENTION`
- `POST /country/add` → `COUNTRY_ADD` (includes `starting_happiness`)
- `POST /country/remove` → `COUNTRY_REMOVE`
- `POST /castle/build` → `BUILD_CASTLE`
- `POST /castle/demolish` → `DEMOLISH_CASTLE`
- `POST /tax/set` → `SET_TAX_RATE` (replaces pending tax change for same country)
- `DELETE /pending/{index}` → remove queued item
- `POST /commit` → `start_simulation_pipeline()`

Config endpoints (`/api/simulation/{id}/config/...`, equilibrium only):

- `POST /alliance_parameters` → update `AllianceParameters`
- `POST /game_parameters` → update `GameParameters` (block reward, castles, happiness limit, emigration rate)

Validation examples:

- Cannot intervene on a country that does not exist (unless pending add) or is pending remove.
- Cannot add a duplicate country; cannot remove a non-existent one (unless pending add cancels).
- Castle build checks gold (including pending build costs); demolish checks castle exists (including pending queue).

### 2. Mempool broadcast (step 1)

`start_simulation_pipeline()` sets:

```python
{
    "interventions": [...],  # copy of pending queue
    "phase": 1,                # PipelinePhase.PHASE_1_INITIAL
    "base_reward": state.game_parameters.block_reward,
}
```

There is **no** top-level mempool `type` field; intervention types live on each queue item.

`PHASE_2` / `PHASE_3` exist in `schemas.py` for compatibility but the orchestrator does **not** run separate stabilization/execution mining rounds today.

Miners poll `/api/simulation/{id}/mempool` and receive `alliance_parameters` + `game_parameters` alongside ledgers.

### 3. Miner preview (decentralized smart contract)

`prepare_block_state()` in `emulator/mempool.py`:

1. Copy gateway ledgers; winner adds `base_reward` to own troops.
2. If `phase == 1`, apply each intervention via `ledger.py` helpers.
3. `apply_economy()` — income (`pop * 1000 * tax_rate`), expense (troops + castle maintenance), deaths or maintenance crisis.
4. `apply_happiness_drift()` then `apply_unhappy_emigration()` — population loss when happiness &lt; `happiness_limit`.
5. `calculate_alliances(troop, castle, current_alliances, alliance_parameters, game_parameters)` → `AllianceResult`.
6. `compute_ledger_deltas()` for block `data`.

`build_block_data()` maps results to wire fields:

- `new_alliances`, `alliance_stability_score`, `alliance_status`
- `troop_ledger_updates`, `gold_ledger_updates`, `pop_ledger_updates`, `castle_ledger_updates`, `happiness_ledger_updates`
- `economic_deaths`, `unhappy_emigration`

### 4. PoW + gossip (`emulator/mining.py`)

- Merkle root = double-SHA256 of mempool + `data` (sorted JSON).
- Target ∝ country troop count / difficulty.
- First hash below target posts to `/miner/submit`; gossip registry stops peer mining for same `(index, phase)`.

### 5. Consensus — gateway relay (step 4 → 0)

`handle_consensus_reached()`:

- Accepts winner's full ledgers (troop, gold, pop, castle, tax, happiness) and alliance fields (pure relay).
- Writes `mempool["data"]`, appends block, processes post-block effects (`COUNTRY_REMOVE`, `SET_TAX_RATE` on tax ledger).
- Resets `step` to `0`, `active_miners = list(troop_ledger.keys())`, clears mempool.

**First valid submit wins**; later submits for the same phase are rejected if `action_winner` is already set.

## Node Manager Rules (`emulator/nodes.py`)

- Poll `/api/state` every ~3s.
- **Start** miner threads at equilibrium for countries in the ledger not yet threaded.
- **Do not** start threads for pending adds during the pipeline; they join at equilibrium after the block lands.
- **Stop** immediately when mempool contains `COUNTRY_REMOVE` for that node (or ledger no longer lists them).

## Alliance Solver (`engine/solver.py`)

- **Algorithm:** brute-force set partitions; club-good payoff `get_alliance_worth(S) = power(S) - fee(S)`; pick valid partition with lowest balance penalty.
- **Imbalance:** `max(alliance attack troops) / min(alliance defense troops + castles) ≤ ratio_limit`.
- **Stability:** ≥2 alliance blocs; each country must prefer its bloc over going solo (relative `epsilon_fraction` loyalty if bloc changed).
- **Parameters:** `AllianceParameters` from gateway (`ratio_limit`, `alpha`, `beta`, `epsilon_fraction`, `strategy`). Defaults in `engine/constants.py`.
- **Castles:** `GameParameters.castles[level].defense` added to defense power only.
- **Return type:** `AllianceResult(alliances, stability_score, outcome: AllianceOutcome)`.
- **Outcomes:** `STABLE`, `NO_STABLE_PARTITION` (WW3). Empty ledger: raise `ValueError` — guard in `mempool.py`.
- **Types:** `engine/partition_types.py` (`PartitionRejectReason`, `PartitionEvaluation`).
- **Not used in production:** `experimental/pygambit-solver/`, PuLP. See `docs/SOLVER_REDESIGN.md`, `docs/FUTURE_WORK.md`.

## Frontend Contract

- WebSocket + REST state: troop/gold/pop/castle/tax/happiness ledgers, `alliances`, `pending_interventions`, `mempool`, `step`, `action_winner`, `alliance_stability_score`, `alliance_status`, `alliance_parameters`, `game_parameters`.
- Commit button disabled unless `step === 0`.
- Config panel submits alliance + game parameters at equilibrium only.
- `alliance_status === "NO_STABLE_PARTITION"` → treat as unstable / game-over UI.

## Quality Checks

- **Determinism:** Same ledgers + parameters + alliances input → same `AllianceResult` (solver is deterministic).
- **Atomic commit:** Gateway only advances on first valid block; partial queue items must not apply without a mined block.
- **Merkle integrity:** Any change to interventions, economy, happiness, or solver output must change the mined hash.
- **Ledger sync:** After equilibrium, every country in `troop_ledger` should eventually have a miner thread; removed countries must not keep mining.

## Legacy / Do Not Assume

- 15-step / three separate mining phases documentation is **out of date**.
- Mempool-level `target` or `BATCH_INTERVENTIONS` type — removed; use `interventions[]` only.
- `calculate_alliances(troop, current_alliances)` two-arg form — removed; pass `castle_ledger`, `AllianceParameters`, `GameParameters`.
- `AllianceInfo` in emulator — replaced by `AllianceResult` on `BlockState.alliance`.
- Tunable solver parameters as future work — **implemented** (see FW-2 in `docs/FUTURE_WORK.md`).

## Key Files

| File | Responsibility |
|------|----------------|
| `api/orchestrator.py` | State machine, commit, consensus |
| `api/routers/god.py` | Intervention queue API |
| `api/routers/config.py` | Alliance + game parameters |
| `api/routers/miner.py` | Mempool poll + block submit |
| `emulator/mempool.py` | Block preview + merkle |
| `emulator/happiness.py` | Tax → happiness, emigration |
| `emulator/mining.py` | PoW loop + submit payload |
| `emulator/nodes.py` | Thread lifecycle |
| `emulator/ledger.py` | Interventions + economy |
| `emulator/ledger_types.py` | `AllianceResult`, `BlockState`, ledger snapshots |
| `engine/solver.py` | Hedonic partition search |
| `engine/alliance_parameters.py` | Solver tuning model |
| `engine/game_parameters.py` | Block reward, castles, happiness rules |
