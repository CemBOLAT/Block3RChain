---
name: implement-simulation-pipeline
description: 'Use when implementing, debugging, or scaffolding any of the 3 phases (15 steps) of the God-Mode EU4 blockchain simulation pipeline. Handles God Interventions, PuLP Solver interactions, and Alliance Executions.'
argument-hint: 'Which phase or step of the pipeline are you working on?'
user-invocable: true
disable-model-invocation: false
---

# Block3RChain Simulation Pipeline Implementation

This skill provides step-by-step guidance for implementing and auditing the 15-step deterministic pipeline for the Block3RChain (God-Mode EU4) simulation.

## When to Use
- Implementing the API (FastAPI) orchestration endpoints.
- Developing the miner (Country) node consensus logic.
- Integrating the PuLP solver for Nash Equilibrium calculations.
- Debugging pipeline state misalignments or consensus failures.

## 15-Step Pipeline Implementation Workflow

Whenever editing the simulation orchestration, ensure the code strictly adheres to these 3 phases. Do not skip steps or combine phases asynchronously.

### Phase 1: God Intervention & Initial State Update
1. **Coinbase Change:** Ensure the God frontend properly signs/sends the supply change.
2. **API Registration:** Validate the backend properly records the exogenous shock.
3. **Mempool Generation:** Verify the API generates a valid mempool and broadcasts it to all countries.
4. **First Block Mined:** Wait for a simulated country node to find the hash/block.
5. **Consensus & Verification:** Ensure the API strictly verifies that *all* countries share the exact same block hash. Fail if out of sync.
6. **Block Reward:** Confirm the API allocates exactly the predetermined reward (+1,000 troops) to the winner's balance.

### Phase 2: State Stabilization & Triggering the Solver
7. **Second Mining Phase:** Mandate a stabilization block.
8. **Second Block Mined:** Same miner logic as Phase 1.
9. **Consensus & Verification:** Re-verify universal consensus.
10. **Solver Invocation:** Construct the mathematical matrix of current troop distributions and call the **PuLP** solver. *Ensure no state changes occur during calculation.*
11. **Solver Resolution:** Parse the optimal alliances returned by PuLP.

### Phase 3: Alliance Execution & Final Broadcast
12. **Third Mining Phase (Execution):** Translate the PuLP output into a deterministically verifiable in-game transaction (mempool).
13. **Third Block Mined:** Mine the alliance execution block.
14. **Final Consensus:** Verify universal consensus on the resultant alliance state.
15. **User Notification:** Emit WebSocket/SSE events to the D3.js frontend to visualize the new geopolitical map.

## Quality Criteria & Completion Checks
- **Determinism:** Are the PuLP outputs deterministic across runs?
- **Atomicity:** If any consensus verification (Steps 5, 9, 14) fails, the system must halt or revert to the previous stable epoch. No partial state updates.
- **Independence:** Does the God UI bypass diplomacy rules (Rule 1) while Country Miners strictly maximize their survival probability (Rule 2)?