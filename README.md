# Block3RChain — Geopolitical Blockchain Simulator

**Block3RChain** is a blockchain simulation where multiple countries compete in a geopolitical game. 

It features a **"God Mode"** where you can intervene and change a country's troop count, which triggers a multi-step blockchain pipeline to reach a new equilibrium. The simulation incorporates:
- **Proof-of-Work (PoW) mining** — multiple country-nodes race to mine blocks
- **Gossip network simulation** — the winner's hash is broadcast to others for consensus
- **PuLP (Linear Programming) solver** — calculates optimal alliances (Nash Equilibrium approximation)
- **Next.js frontend** — a real-time dashboard to observe the simulation

## Architecture Overview

```text
Block3RChain/
├── backend/
│   ├── api/main.py         ← FastAPI server (the "Orchestrator") — runs on port 8000
│   ├── emulator/nodes.py   ← miner threads (one per country)
│   ├── emulator/core.py    ← Block/genesis block logic
│   └── engine/solver.py    ← PuLP alliance solver
├── frontend/               ← Next.js dashboard — runs on port 3000
└── README.md
```

---

## Prerequisites

Before running the project, you must have the following installed on your system:

### 1. Python (≥ 3.9)
Check if you have it installed:
```bash
python --version
```
If not, download from [python.org/downloads](https://www.python.org/downloads/). **Make sure to check "Add python.exe to PATH" during installation.**

### 2. Node.js (≥ 18)
Check if you have it installed:
```bash
node --version
npm --version
```
If not, download from [nodejs.org](https://nodejs.org/).

---

## Step-by-Step: Running the Project

You can run the project using our automated scripts or manually. All scripts are in the `scripts/` folder.

### Method 1: Automated Startup (Recommended)

This is the fastest way to get everything running.

- **macOS / Linux**:
  ```bash
  # Install dependencies and setup venv (one-time)
  ./scripts/install.sh
  
  # Launch all processes in Terminal tabs
  ./scripts/run.sh
  ```
- **Windows**:
  ```bash
  .\scripts\run.bat
  ```

---

### Method 2: Manual Startup

If you prefer to run the components manually, you need to run **3 separate processes** in **3 separate terminal windows**.

### Terminal 1 — Start the FastAPI Backend

The backend is the orchestrator of the blockchain system.

```bash
# Navigate to the backend folder
cd backend

# Create and activate virtual environment (macOS/Linux)
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the API server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
- You should see: `Uvicorn running on http://0.0.0.0:8000`. Leave this terminal open.

### Terminal 2 — Start the Miner Nodes

> **Important:** The API server (Terminal 1) **must be running** before you start the miners.

```bash
# Navigate to the backend folder
cd backend

# Activate virtual environment
source venv/bin/activate

# Run the miner nodes (creates threads for each configured country)
python -m emulator.nodes
```
- You should see each country print: `[Country] Mining node started. Waiting for Mempool orders...`. 
The miners are now idle, polling the API and waiting for an intervention to start mining. Leave this terminal open.

### Terminal 3 — Start the Frontend Dashboard

```bash
# Navigate to the frontend folder
cd frontend

# Install Node.js dependencies
npm install

# Start the Next.js development server
npm run dev
```
- You should see: `Local: http://localhost:3000`. Leave this terminal open.

---

## How to Play

Once all 3 processes are running:
1. Open http://localhost:3000 in your browser.
2. In the "**God-Mode Panel**" on the left, select a country and enter a Troop amount to inject (or remove) via an exogenous shock.
3. Click "**Smite!**" to trigger the intervention.
4. Watch the pipeline run! The miners will begin PoW mining in the background, gossip their results, reach consensus, run the PuLP solver for new alliances, and update the UI in real-time until a new Equilibrium (Step 0) is reached.