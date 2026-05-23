import type { AllianceParameters } from "./allianceParameters";

export type SimulationPhase = "SETUP" | "SIMULATION";

export const ALLIANCE_OUTCOMES = [
  "STABLE",
  "NO_STABLE_PARTITION",
] as const;

export type AllianceOutcome = (typeof ALLIANCE_OUTCOMES)[number];

export interface Simulation {
  id: string;
  name: string;
  nations: Record<string, { troops: number; gold: number; population: number }>;
}

export interface SimulationStartPayload {
  name: string;
  nations: Record<string, { troops: number; gold: number; population: number }>;
  alliance_parameters: AllianceParameters;
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
  alliances: string[][];
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
    new_alliances?: string[][];
    alliance_stability_score?: number | null;
    alliance_status?: AllianceOutcome | null;
    [key: string]: unknown;
  };
  index?: number;
  index_to_mine?: number;
  interventions?: Mempool[];
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
  alliances: string[][];
  alliance_stability_score: number | null;
  alliance_status: AllianceOutcome | null;
  alliance_parameters?: AllianceParameters;
  mempool: Mempool | null;
  latest_block_hash: string | null;
  chain_length: number;
  action_winner: string | null;
  alliance_winner: string | null;
  current_reward: number;
  pending_interventions: Mempool[];
}
