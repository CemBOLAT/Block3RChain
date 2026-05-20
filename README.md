# Block3RChain — Geopolitical Blockchain Simulator

**Block3RChain** is a blockchain simulation where multiple countries compete in a geopolitical game.

A **God Mode** operator queues exogenous shocks (troop/gold/population changes, country add/remove), then commits them as a single batched block. Country nodes race to mine that block; the winner's state becomes the new world equilibrium. The simulation includes:

- **Persistent templates** — simulation setups stored in PostgreSQL (SQLModel).
- **Proof-of-work mining** — one thread per country; hash rate scales with troop count.
- **Gossip consensus** — the first valid block hash is shared; other miners yield.
- **Batch intervention mempool** — all queued god actions land in one `interventions` list per block.
- **Hedonic alliance solver** — partition search with coordination fees and club-good payoffs (`backend/engine/solver.py`); returns `AllianceResult` with `AllianceOutcome`.
- **Per-block economy** — population income, troop upkeep, and unpaid-soldier deaths (`apply_economy` in `backend/emulator/ledger.py`).
- **Next.js dashboard** — real-time map, intervention queue, pipeline view, WebSocket state sync.

## Architecture Overview

```text
Block3RChain/
├── backend/
│   ├── api/
│   │   ├── main.py              ← FastAPI orchestrator (port 8000)
│   │   ├── orchestrator.py      ← simulation state, pipeline, WebSocket broadcast
│   │   ├── routers/             ← god, miner, simulation endpoints
│   │   └── database/            ← SQLModel models + PostgreSQL
│   ├── emulator/
│   │   ├── nodes.py             ← NodeManager + per-country mining loops
│   │   ├── mining.py            ← PoW, gossip, block submission
│   │   ├── mempool.py           ← snapshot gateway mempool, build block payload
│   │   ├── ledger.py            ← interventions, economy, ledger deltas
│   │   ├── ledger_types.py      ← LedgerSnapshot, BlockState, AllianceResult
│   │   └── core.py              ← genesis block helpers
│   ├── engine/
│   │   ├── solver.py            ← hedonic partition alliance solver
│   │   ├── partition_types.py   ← internal partition evaluation types
│   │   └── constants.py         ← Bell numbers lookup
│   ├── config.py                ← API_BASE_URL for miners
│   └── scripts/seed_db.py
├── frontend/                    ← Next.js dashboard (port 3000)
├── experimental/                ← legacy PyGambit / research solvers (not used at runtime)
├── docker-compose.yml           ← PostgreSQL 15 (host port 5433)
└── scripts/                     ← install.sh / run.sh helpers
```

### Runtime flow (current pipeline)

The live pipeline is a **single mining round** per commit (not a multi-phase 15-step chain):

| Step | `orchestrator.step` | What happens |
|------|---------------------|--------------|
| Equilibrium | `0` | God queues interventions in `pending_interventions`. Miners idle. |
| Commit | `1` | `POST .../god/commit` builds mempool: `{ interventions, phase: 1, base_reward }`. |
| Mining | `1` | Each node previews: apply interventions → economy → `calculate_alliances()` → PoW on merkle root. |
| Consensus | `4` → `0` | First valid `POST .../miner/submit` wins; gateway copies winner ledgers + alliances, appends block, returns to equilibrium. |

**Node lifecycle**

- New countries get a miner thread only at **equilibrium** once they appear in the troop ledger.
- A country scheduled for **removal** shuts down its thread as soon as the mempool lists `COUNTRY_REMOVE` for it.

**Solver API**

```python
from engine.solver import calculate_alliances
from emulator.ledger_types import AllianceResult

result: AllianceResult = calculate_alliances(troop_ledger, current_alliances)
# result.alliances, result.stability_score, result.outcome
# outcome: AllianceOutcome.STABLE | AllianceOutcome.NO_STABLE_PARTITION
# Raises ValueError if troop_ledger is empty (callers must guard).
```

---

## Prerequisites

- **Python** ≥ 3.9
- **Node.js** ≥ 18
- **Docker Desktop** (for PostgreSQL) — [Download](https://www.docker.com/products/docker-desktop/)

---

## Running the project

### 1. Installation (one-time)

- **Windows:** `.\scripts\install.bat`
- **macOS / Linux:** `./scripts/install.sh`

### 2. Launch

Starts PostgreSQL, seeds templates, and runs backend, node emulator, and frontend:

- **Windows:** `.\scripts\run.bat`
- **macOS / Linux:** `./scripts/run.sh`

Services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API / WebSocket | http://localhost:8000 |
| PostgreSQL | `localhost:5433` |

---

## How to play

1. Open http://localhost:3000 and load or create a simulation from templates.
2. Use **God Mode** (left-click countries on the map, or right-click quick actions) to queue interventions:
   - `GOD_INTERVENTION` — troop / gold / population deltas
   - `COUNTRY_ADD` / `COUNTRY_REMOVE`
3. Review the **Pending Queue** and click **COMMIT** (only while step is equilibrium).
4. Watch miners compete; the dashboard updates via WebSocket when consensus completes.
5. Inspect alliances, stability score, and block history. `NO_STABLE_PARTITION` means no stable multipolar coalition exists under current rules (WW3 / game over).

See [docs/FUTURE_WORK.md](docs/FUTURE_WORK.md) for planned features (economy-aware alliances, tunable solver parameters).

---

## Database

- **Engine:** PostgreSQL 15 (Docker)
- **Host port:** 5433 (mapped from container 5432)
- **ORM:** SQLModel

---

## Development notes

- **Production solver:** `backend/engine/solver.py` (hedonic coalition search over set partitions). `PuLP` / `pygambit` in `requirements.txt` and `experimental/` are legacy research code, not used on the live miner path.
- **Design docs:** [docs/SOLVER_REDESIGN.md](docs/SOLVER_REDESIGN.md), [docs/FUTURE_WORK.md](docs/FUTURE_WORK.md).
- **Intervention field names** in the pending queue match `god.py` and `ledger.py` (`troop_change`, `gold_change`, `pop_change`, `starting_population`, etc.).
- **Block payload** (`mempool["data"]`) includes `new_alliances`, `alliance_stability_score`, `alliance_status`, `troop_ledger_updates`, `gold_ledger_updates`, `pop_ledger_updates`, and `economic_deaths`.
