# Block3RChain — Geopolitical Blockchain Simulator

**Block3RChain** is a blockchain simulation where multiple countries compete in a geopolitical game. 

It features a **"God Mode"** where you can intervene and change a country's troop count, which triggers a multi-step blockchain pipeline to reach a new equilibrium. The simulation incorporates:
- **Persistent Data** — Simulation templates are stored in a PostgreSQL database.
- **Proof-of-Work (PoW) mining** — multiple country-nodes race to mine blocks.
- **Gossip network simulation** — the winner's hash is broadcast to others for consensus.
- **PuLP (Linear Programming) solver** — calculates optimal alliances (Nash Equilibrium approximation).
- **Next.js frontend** — a real-time dashboard with centralized configuration and global error handling.

## Architecture Overview

```text
Block3RChain/
├── backend/
│   ├── api/
│   │   ├── database/       ← SQLModel models and DB connection logic
│   │   └── main.py         ← FastAPI server (the "Orchestrator") — port 8000
│   ├── emulator/nodes.py   ← miner threads (one per country)
│   ├── engine/solver.py    ← PuLP alliance solver
│   └── scripts/seed_db.py  ← Database seeding utility
├── frontend/               ← Next.js dashboard — port 3000
├── docker-compose.yml      ← PostgreSQL 15 container (port 5433)
└── scripts/                ← Automated install and run scripts
```

---

## Prerequisites

Before running the project, you must have the following installed on your system:

### 1. Python (≥ 3.9)
Check if you have it installed:
```bash
python --version
```

### 2. Node.js (≥ 18)
Check if you have it installed:
```bash
node --version
```

### 3. Docker & Docker Compose
The project uses PostgreSQL for persistence. You must have **Docker Desktop** installed and running.
- [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Step-by-Step: Running the Project

The fastest way to get everything running is to use our automated scripts.

### 1. Installation (One-time)
This will set up your virtual environment, install Python/NPM dependencies, and check for Docker.

- **Windows**:
  ```bash
  .\scripts\install.bat
  ```
- **macOS / Linux**:
  ```bash
  ./scripts/install.sh
  ```

### 2. Launch the Simulation
This script will start the PostgreSQL container, seed the database with initial templates, and launch the Backend, Miners, and Frontend in separate tabs.

- **Windows**:
  ```bash
  .\scripts\run.bat
  ```
- **macOS / Linux**:
  ```bash
  ./scripts/run.sh
  ```

---

## How to Play

1. Open http://localhost:3000 in your browser.
2. The app will fetch simulation templates from the database. If the database is empty or the server is down, a **Themed Error Modal** will warn you.
3. In the "**God-Mode Panel**", select a country and adjust the Troop amount.
4. Click "**Smite!**" to trigger the intervention.
5. Watch the pipeline run through mining, consensus, and solver phases until a new Equilibrium is reached.

---

## Database Configuration
- **Database**: PostgreSQL 15
- **Port**: 5433 (Default is mapped from 5432 to avoid local conflicts)
- **ORM**: SQLModel (SQLAlchemy + Pydantic)