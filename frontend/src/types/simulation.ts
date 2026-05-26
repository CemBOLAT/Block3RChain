import type { AllianceParameters } from "./allianceParameters";
import type { GameParameters } from "./gameParameters";

export type SimulationPhase = "SETUP" | "SIMULATION";

export const ALLIANCE_OUTCOMES = [
  "STABLE",
  "NO_STABLE_PARTITION",
] as const;

export type AllianceOutcome = (typeof ALLIANCE_OUTCOMES)[number];

export interface NationConfig {
  troops: number;
  gold: number;
  population: number;
  happiness: number;
  rivals: string[];
}

export interface Simulation {
  id: string;
  name: string;
  nations: Record<string, NationConfig>;
}

export interface SimulationStartPayload {
  name: string;
  nations: Record<string, NationConfig>;
  alliance_parameters: AllianceParameters;
  game_parameters?: GameParameters;
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
  level?: number;
  troop_change?: number;
  gold_change?: number;
  pop_change?: number;
  starting_troops?: number;
  starting_gold?: number;
  starting_population?: number;
  starting_happiness?: number;
  data?: {
    new_alliances?: string[][];
    alliance_stability_score?: number | null;
    alliance_status?: AllianceOutcome | null;
    troop_ledger_updates?: Record<string, number>;
    gold_ledger_updates?: Record<string, number>;
    pop_ledger_updates?: Record<string, number>;
    castle_ledger_updates?: Record<string, number[]>;
    happiness_ledger_updates?: Record<string, number>;
    economic_deaths?: Record<string, number>;
    unhappy_emigration?: Record<string, number>;
    [key: string]: unknown;
  };
  index?: number;
  index_to_mine?: number;
  interventions?: Mempool[];
  [key: string]: unknown;
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
  castle_ledger: Record<string, number[]>;
  tax_ledger?: Record<string, number>;
  happiness_ledger?: Record<string, number>;
  rival_ledger?: Record<string, string[]>;
  alliances: string[][];
  alliance_stability_score: number | null;
  alliance_status: AllianceOutcome | null;
  alliance_parameters?: AllianceParameters;
  game_parameters?: GameParameters;
  mempool: Mempool | null;
  latest_block_hash: string | null;
  chain_length: number;
  action_winner: string | null;
  alliance_winner: string | null;
  current_reward: number;
  pending_interventions: Mempool[];
}

