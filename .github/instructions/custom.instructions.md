# Project: Chaos-driven Blockchain Map Simulation (God-Mode EU4)

## 📌 Project Vision
This is a **decentralized chaos simulation** where the primary objective is to observe how a world of autonomous agents (Countries/Miners) returns to a state of equilibrium despite continuous, heavy-handed interventions from a "God" entity.

In this simulation:
- **The God (You):** Manages the `Coinbase`. You can inject or delete troops (tokens) from any country at will. You are the source of exogenous shocks.
- **The Countries (Miners):** Act as network validators. They compete/collaborate to solve "blocks" to earn troop rewards.
- **The Equilibrium:** Despite God's chaos, countries will form alliances, trade troops, or declare peace based on **Nash Equilibrium** principles to ensure survival.

---

## 🛠 Software Stack

### 1. Frontend: The Visualization Layer
- **Framework:** Next.js (TypeScript)
- **Mapping & Graphics:** - **D3.js:** For dynamic SVG map rendering and province-based data visualization.
  - **React-Force-Graph:** To visualize the evolving web of alliances and diplomatic tensions.
- **State Management:** Zustand (for real-time simulation state).

### 2. API: The Orchestration Layer
- **Engine:** FastAPI (Python)
- **Simulation Logic:** - **PuLP:** To solve the optimization problems (Best Response) for each country during every "Tick".
- **Database:** PostgreSQL (to store historical states, alliances, and transactions).

### 3. Blockchain: The State Machine
- **Network:** Custom Python-based lightweight blockchain emulator (`backend/emulator`).
- **Core State Modules (Python):**
  - `TroopLedger`: State dictionary representing military power per country.
  - `DiplomacyRules`: Validates automated alliance/peace treaties based on Solver outputs.
  - `CoinbaseManager`: The God's interface for resource injection, bypassing standard mining.

---

## ⏳ System Pipeline & Simulation Logic

The simulation operates on a strict, 15-step deterministic pipeline whenever there is an external intervention:

### Phase 1: God Intervention & Initial State Update
1. **Coinbase Change:** The user (God) modifies the Coinbase (e.g., injects troops).
2. **API Registration:** These changes are sent to the Backend (API).
3. **Mempool Generation:** The API commands all active Countries (miners): "This is your mempool, mine it."
4. **First Block Mined:** A Country successfully mines the block and broadcasts it to the other Countries.
5. **Consensus & Verification:** Countries announce the new block to the API. The API verifies that all countries have synchronized on this exact block.
6. **Block Reward:** The API grants a block reward (e.g., +1,000 troops) to the winning Country.

### Phase 2: State Stabilization & Triggering the Solver
7. **Second Mining Phase:** Mining is restarted to stabilize and confirm the network state.
8. **Second Block Mined:** A Country mines the block and broadcasts it.
9. **Consensus & Verification:** Countries record the new block. The API verifies universal consensus again.
10. **Solver Invocation:** With a stable chain recorded, the API queries the Solver (PuLP) to calculate new optimal alliances.
11. **Solver Resolution:** The Solver returns the mathematical optimal actions/alliances to the API.

### Phase 3: Alliance Execution & Final Broadcast
12. **Third Mining Phase (Execution):** The API translates the Solver's output into an in-game transaction (mempool) and orders the network to mine it.
13. **Third Block Mined:** A Country mines the alliance-execution block and broadcasts it.
14. **Final Consensus:** Countries announce the verified alliance block. The API confirms universal consensus.
15. **User Notification:** The API announces the newly formed alliances back to the frontend/user interface.

---

## 🚀 Architecture Bootstrapping

Since the project follows a custom 15-step orchestration pipeline, the initialization involves standing up the orchestrator, the visualization layer, and the independent country (miner) nodes:

1. **Setup Backend API (Orchestrator & Solver):** 
   - `pip install fastapi pulp uvicorn`
   - Launch the FastAPI server. This API will direct the 3-phase pipeline, trigger PuLP calculations, and verify miner consensus.
2. **Setup Country Nodes (Miners):** 
   - Initialize the local lightweight blockchain emulators or scripts that represent the Countries. Ensure they are polling/listening to the API for mempool broadcasts.
3. **Setup Frontend (God UI):** 
   - `cd frontend && npm install`
   - `npm run dev` to launch the D3.js interactive map.
4. **Trigger First Epoch:** 
   - As the "God", use the Frontend UI to inject a Coinbase transaction, jumpstarting Phase 1 of the simulation.

---

## 📜 Simulation Rules
1. **The God is Absolute:** Coinbase edits bypass all diplomatic rules.
2. **Rational Actors:** Countries must always act to maximize their "Survival Probability" (Utility Function).
3. **Transparency:** All troop counts and alliance contracts are public (On-chain), representing a world of perfect information.