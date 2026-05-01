export type SimulationPhase = "SETUP" | "SIMULATION";

export interface Simulation {
  id: string;
  name: string;
  nations: Record<string, { troops: number; gold: number; population: number }>;
}

export interface NationAddProps {
  name: string;
  troops: number;
  gold: number;
  population: number;
}

export interface SavedSimulation {
  id: number;
  name: string;
  timestamp: string;
  ledger: Record<string, number>;
  gold_ledger?: Record<string, number>;
  pop_ledger?: Record<string, number>;
  alliances: string[];
}

export interface Mempool {
  type: string;
  target: string;
  phase: number;
  base_reward: number;
  change?: number;
  gold_change?: number;
  pop_change?: number;
  starting_troops?: number;
  starting_gold?: number;
  population?: number;
  data?: {
    new_alliances?: string[];
    [key: string]: unknown;
  };
  index?: number;
  index_to_mine?: number;
}

export interface Block {
  index: number;
  previous_hash: string;
  mempool: Mempool;
  nonce: number;
  timestamp: number;
  difficulty: number;
  hash: string;
  miner: string | null;
  reward: number;
}

export interface SimulationStateData {
  simulation_id: string;
  step: number;
  is_initialized: boolean;
  ledger: Record<string, number>;
  gold_ledger: Record<string, number>;
  pop_ledger: Record<string, number>;
  alliances: string[];
  mempool: Mempool | null;
  latest_block_hash: string | null;
  chain_length: number;
  action_winner: string | null;
  alliance_winner: string | null;
  current_reward: number;
}
